import type { SQLiteBindValue } from 'expo-sqlite';

import type { MonthKey } from '@/domain/dates';

import { getDb } from './db';
import { goalToRow, profileToRow, rowToGoal, rowToProfile, rowToTransaction, transactionToRow } from './mappers';
import type { Profile, SavingsGoal, SyncedTable, Transaction } from './types';

/**
 * SQLite access. Table and column names come from constants in this file, never from input.
 * All values go through bound parameters.
 */
type Row = Record<string, unknown>;

export const nowIso = () => new Date().toISOString();

const toBindValue = (value: unknown): SQLiteBindValue => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' || typeof value === 'string') return value;
  return JSON.stringify(value);
};

/** Insert-or-update by primary key. `dirty` marks the row for the next push. */
export async function upsertRow(table: SyncedTable, row: Row, dirty: boolean): Promise<void> {
  const db = await getDb();
  const columns = [...Object.keys(row), 'dirty'];
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})
     ON CONFLICT(id) DO UPDATE SET ${updates}`,
    [...Object.values(row).map(toBindValue), dirty ? 1 : 0]
  );
}

// ---------------------------------------------------------------- profiles

export function newProfile(userId: string, fullName: string): Profile {
  return {
    id: userId,
    fullName,
    avatarPath: null,
    currency: 'INR',
    monthlySalaryMinor: 0,
    salaryRule: { kind: 'last_working_day' },
    allocation: 'following_month',
    notificationsEnabled: true,
    onboardedAt: null,
    updatedAt: nowIso(),
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM profiles WHERE id = ?', userId);
  return row ? rowToProfile(row) : null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await upsertRow('profiles', profileToRow({ ...profile, updatedAt: nowIso() }, false), true);
}

// ---------------------------------------------------------------- transactions

export async function listTransactions(
  userId: string,
  { month, limit }: { month?: MonthKey; limit?: number } = {}
): Promise<Transaction[]> {
  const db = await getDb();
  const params: SQLiteBindValue[] = [userId];
  let sql = 'SELECT * FROM transactions WHERE user_id = ? AND deleted_at IS NULL';
  if (month) {
    sql += ' AND budget_month = ?';
    params.push(month);
  }
  sql += ' ORDER BY occurred_on DESC, created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  const rows = await db.getAllAsync<Row>(sql, params);
  return rows.map(rowToTransaction).filter((tx): tx is Transaction => tx !== null);
}

/** Includes soft-deleted rows so auto entries the user removed aren't re-created. */
export async function getTransaction(userId: string, id: string): Promise<Transaction | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM transactions WHERE user_id = ? AND id = ?', userId, id);
  return row ? rowToTransaction(row) : null;
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  await upsertRow('transactions', transactionToRow({ ...tx, updatedAt: nowIso() }), true);
}

/** Soft delete, so the deletion syncs to other devices. */
export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const tx = await getTransaction(userId, id);
  if (!tx || tx.deletedAt) return;
  await saveTransaction({ ...tx, deletedAt: nowIso() });
}

// ---------------------------------------------------------------- savings goals

export async function getActiveGoal(userId: string): Promise<SavingsGoal | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(
    'SELECT * FROM savings_goals WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
    userId
  );
  return row ? rowToGoal(row) : null;
}

export async function saveGoal(goal: SavingsGoal): Promise<void> {
  await upsertRow('savings_goals', goalToRow({ ...goal, updatedAt: nowIso() }), true);
}

export async function deleteGoal(goal: SavingsGoal): Promise<void> {
  await saveGoal({ ...goal, deletedAt: nowIso() });
}

/** Total contributed to a goal, optionally leaving out one month (to recompute that month). */
export async function savedTotal(userId: string, goalId: string, excludeMonth?: MonthKey): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount_minor) AS total FROM transactions
     WHERE user_id = ? AND goal_id = ? AND type = 'savings' AND deleted_at IS NULL AND budget_month != ?`,
    userId,
    goalId,
    excludeMonth ?? ''
  );
  return row?.total ?? 0;
}

// ---------------------------------------------------------------- sync bookkeeping

const OWNER_COLUMN: Record<SyncedTable, 'id' | 'user_id'> = {
  profiles: 'id',
  savings_goals: 'user_id',
  transactions: 'user_id',
};

export async function dirtyRows(table: SyncedTable, userId: string): Promise<Row[]> {
  const db = await getDb();
  return db.getAllAsync<Row>(`SELECT * FROM ${table} WHERE dirty = 1 AND ${OWNER_COLUMN[table]} = ?`, userId);
}

/** Clears the dirty flag only if the row wasn't edited again while the push was in flight. */
export async function markClean(table: SyncedTable, id: string, updatedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE ${table} SET dirty = 0 WHERE id = ? AND updated_at = ?`, id, updatedAt);
}

export async function isDirty(table: SyncedTable, id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ dirty: number }>(`SELECT dirty FROM ${table} WHERE id = ?`, id);
  return row?.dirty === 1;
}

export async function getCursor(userId: string, table: SyncedTable): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ last_pulled_at: string | null }>(
    'SELECT last_pulled_at FROM sync_cursors WHERE user_id = ? AND entity = ?',
    userId,
    table
  );
  return row?.last_pulled_at ?? null;
}

export async function setCursor(userId: string, table: SyncedTable, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_cursors (user_id, entity, last_pulled_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id, entity) DO UPDATE SET last_pulled_at = excluded.last_pulled_at`,
    userId,
    table,
    value
  );
}
