import { supabase } from '@/lib/supabase';

import { goalToRow, profileToRow, rowToGoal, rowToProfile, rowToTransaction, transactionToRow } from './mappers';
import { dirtyRows, getCursor, isDirty, markClean, setCursor, upsertRow } from './repositories';
import { isRowSpecificError } from './sync-errors';
import type { SyncedTable } from './types';

/**
 * Two-step sync, in this order:
 * 1. push: upsert every dirty local row (the server stamps `updated_at`)
 * 2. pull: fetch rows whose server `updated_at` is past our cursor and apply them, unless the
 *    local copy has unpushed edits (a local edit wins until it's pushed).
 * Goals go before transactions because transactions reference goals.
 */
type Row = Record<string, unknown>;

interface Entity {
  table: SyncedTable;
  owner: 'id' | 'user_id';
  onConflict: string;
  /** Validates and normalizes a row (from the server or disk) into the local column set. */
  normalize: (row: Row) => Row | null;
}

const ENTITIES: readonly Entity[] = [
  {
    table: 'profiles',
    owner: 'id',
    onConflict: 'id',
    normalize: (row) => {
      const profile = rowToProfile(row);
      return profile ? profileToRow(profile, false) : null;
    },
  },
  {
    table: 'savings_goals',
    owner: 'user_id',
    onConflict: 'user_id,id',
    normalize: (row) => {
      const goal = rowToGoal(row);
      return goal ? goalToRow(goal) : null;
    },
  },
  {
    table: 'transactions',
    owner: 'user_id',
    onConflict: 'user_id,id',
    normalize: (row) => {
      const tx = rowToTransaction(row);
      return tx ? transactionToRow(tx) : null;
    },
  },
];

const PAGE_SIZE = 500;
const PUSH_CHUNK = 100;

function toServerRow(table: SyncedTable, row: Row): Row {
  const { dirty: _dirty, ...rest } = row;
  if (table === 'profiles') {
    return { ...rest, notifications_enabled: rest.notifications_enabled === 1 || rest.notifications_enabled === true };
  }
  return rest;
}

async function push(entity: Entity, userId: string): Promise<number> {
  const client = supabase!;
  const upsert = (rows: Row[]) =>
    client.from(entity.table).upsert(
      rows.map((row) => toServerRow(entity.table, row)),
      { onConflict: entity.onConflict }
    );

  const rows = (await dirtyRows(entity.table, userId)).filter((row) => entity.normalize(row) !== null);
  let pushed = 0;
  for (let i = 0; i < rows.length; i += PUSH_CHUNK) {
    const chunk = rows.slice(i, i + PUSH_CHUNK);
    const { error } = await upsert(chunk);
    if (!error) {
      for (const row of chunk) await markClean(entity.table, String(row.id), String(row.updated_at));
      pushed += chunk.length;
      continue;
    }
    if (!isRowSpecificError(error)) throw error;
    // One bad row must not block the rest: retry each row on its own. A rejected row stays dirty
    // (kept locally, retried on the next run) instead of stalling the whole queue.
    for (const row of chunk) {
      const single = await upsert([row]);
      if (single.error && !isRowSpecificError(single.error)) throw single.error;
      if (!single.error) {
        await markClean(entity.table, String(row.id), String(row.updated_at));
        pushed += 1;
      }
    }
  }
  return pushed;
}

async function pull(entity: Entity, userId: string): Promise<number> {
  const client = supabase!;
  let cursor = await getCursor(userId, entity.table);
  let applied = 0;
  for (;;) {
    let query = client
      .from(entity.table)
      .select('*')
      .eq(entity.owner, userId)
      .order('updated_at', { ascending: true })
      .limit(PAGE_SIZE);
    if (cursor) query = query.gt('updated_at', cursor);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    for (const remote of rows) {
      // RLS already scopes rows to this user. This check stops a misconfigured policy from leaking data locally.
      if (remote[entity.owner] !== userId) continue;
      const local = entity.normalize(remote);
      if (!local || (await isDirty(entity.table, String(local.id)))) continue;
      await upsertRow(entity.table, local, false);
      applied += 1;
    }
    const last = rows[rows.length - 1];
    if (last && typeof last.updated_at === 'string') {
      cursor = last.updated_at;
      await setCursor(userId, entity.table, cursor);
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return applied;
}

/** @throws on network/server errors. Callers treat that as "still offline" and retry later. */
export async function syncNow(userId: string): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 };
  let pushed = 0;
  let pulled = 0;
  for (const entity of ENTITIES) pushed += await push(entity, userId);
  for (const entity of ENTITIES) pulled += await pull(entity, userId);
  return { pushed, pulled };
}
