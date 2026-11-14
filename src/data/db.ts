import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

/**
 * Local-first store. Every write lands here first (`dirty = 1`) and is pushed to Supabase by
 * the sync engine. Migrations are append-only and tracked with `PRAGMA user_version`.
 */
const DB_NAME = 'tally.db';

const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_path TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    monthly_salary_minor INTEGER NOT NULL DEFAULT 0,
    salary_rule TEXT NOT NULL DEFAULT 'last_working_day',
    salary_day INTEGER,
    budget_allocation TEXT NOT NULL DEFAULT 'following_month',
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    onboarded_at TEXT,
    updated_at TEXT NOT NULL,
    dirty INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_minor INTEGER,
    target_month TEXT,
    contribution_mode TEXT NOT NULL DEFAULT 'fixed',
    fixed_monthly_minor INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    dirty INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'manual',
    amount_minor INTEGER NOT NULL,
    category TEXT,
    source TEXT,
    note TEXT,
    goal_id TEXT,
    occurred_on TEXT NOT NULL,
    budget_month TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    dirty INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions (user_id, budget_month);
  CREATE INDEX IF NOT EXISTS idx_transactions_dirty ON transactions (dirty);
  CREATE TABLE IF NOT EXISTS sync_cursors (
    user_id TEXT NOT NULL,
    entity TEXT NOT NULL,
    last_pulled_at TEXT,
    PRIMARY KEY (user_id, entity)
  );
  `,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Web only. expo-sqlite keeps its files in the browser's private file system, and only one tab
 * at a time can hold them. A second Tally tab (an email link opens one) can't open the database,
 * and its SQLite worker stays broken, so that tab has to reload once the other one is closed.
 */
export class DatabaseInUseError extends Error {
  constructor() {
    super('Tally is open in another tab.');
    this.name = 'DatabaseInUseError';
  }
}

async function openWithLockCheck(): Promise<SQLite.SQLiteDatabase> {
  try {
    return await SQLite.openDatabaseAsync(DB_NAME);
  } catch (error) {
    // Chrome: "Failed to execute 'createSyncAccessHandle' … Access Handles cannot be created if
    // there is another open Access Handle …" (other browsers word it differently, hence the loose match).
    if (Platform.OS === 'web' && /access ?handle|NoModificationAllowed/i.test(String(error))) {
      throw new DatabaseInUseError();
    }
    throw error;
  }
}

/**
 * Runs `sql` in one transaction. On a phone it's an exclusive transaction (its own connection, so
 * nothing interleaves). expo-sqlite's web build throws on those, so web uses a plain transaction.
 */
async function execInTransaction(db: SQLite.SQLiteDatabase, sql: string): Promise<void> {
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(() => db.execAsync(sql));
    return;
  }
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(sql);
  });
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let version = row?.user_version ?? 0; version < MIGRATIONS.length; version += 1) {
    await execInTransaction(db, MIGRATIONS[version]!);
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await openWithLockCheck();
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= open().catch((error: unknown) => {
    dbPromise = null; // allow a retry on the next call
    throw error;
  });
  return dbPromise;
}

/** Removes every local row. Used on sign-out so the next person on this device sees nothing. */
export async function clearLocalData(): Promise<void> {
  const db = await getDb();
  await execInTransaction(
    db,
    'DELETE FROM transactions; DELETE FROM savings_goals; DELETE FROM profiles; DELETE FROM sync_cursors;'
  );
}
