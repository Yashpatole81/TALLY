import { profileToRow, rowToGoal, rowToProfile, rowToTransaction, transactionToRow } from './mappers';
import type { Transaction } from './types';

const USER = '0b6a3c2e-8f1d-4a5b-9c7d-1e2f3a4b5c6d';
const TX_ID = '7d1c2b3a-4e5f-4a6b-8c9d-0e1f2a3b4c5d';

const tx: Transaction = {
  id: TX_ID,
  userId: USER,
  type: 'expense',
  kind: 'manual',
  amountMinor: 120_000,
  category: 'food',
  source: null,
  note: 'Grocery Shopping',
  goalId: null,
  occurredOn: '2026-11-04',
  budgetMonth: '2026-11',
  createdAt: '2026-11-04T08:00:00.000Z',
  updatedAt: '2026-11-04T08:00:00.000Z',
  deletedAt: null,
};

describe('transaction mapping', () => {
  it('round-trips through a row', () => {
    expect(rowToTransaction(transactionToRow(tx))).toEqual(tx);
  });

  it('accepts bigint amounts serialized as strings by PostgREST', () => {
    expect(rowToTransaction({ ...transactionToRow(tx), amount_minor: '120000' })?.amountMinor).toBe(120_000);
  });

  it('rejects invalid rows', () => {
    const row = transactionToRow(tx);

    expect(rowToTransaction({ ...row, id: 'not-a-uuid' })).toBeNull();
    expect(rowToTransaction({ ...row, type: 'transfer' })).toBeNull();
    expect(rowToTransaction({ ...row, amount_minor: -5 })).toBeNull();
    expect(rowToTransaction({ ...row, amount_minor: 1e15 })).toBeNull();
    expect(rowToTransaction({ ...row, occurred_on: '2026-02-30' })).toBeNull();
  });

  it('drops unknown categories and trims long notes', () => {
    const mapped = rowToTransaction({ ...transactionToRow(tx), category: '<script>', note: 'x'.repeat(100) });

    expect(mapped?.category).toBeNull();
    expect(mapped?.note).toHaveLength(60);
  });
});

describe('profile mapping', () => {
  const row = {
    id: USER,
    full_name: 'Yash',
    avatar_path: null,
    currency: 'INR',
    monthly_salary_minor: 1_600_000,
    salary_rule: 'custom_date',
    salary_day: 30,
    budget_allocation: 'following_month',
    notifications_enabled: 1,
    onboarded_at: null,
    updated_at: '2026-11-07T10:00:00.000Z',
  };

  it('maps SQLite rows (0/1 booleans) and server rows (true/false)', () => {
    const profile = rowToProfile(row)!;

    expect(profile.salaryRule).toEqual({ kind: 'custom_date', day: 30 });
    expect(profile.notificationsEnabled).toBe(true);
    expect(profileToRow(profile, true).notifications_enabled).toBe(true);
    expect(profileToRow(profile, false).notifications_enabled).toBe(1);
  });

  it('falls back to safe defaults for unexpected values', () => {
    const profile = rowToProfile({ ...row, currency: 'BTC', salary_rule: 'custom_date', salary_day: 45 })!;

    expect(profile.currency).toBe('INR');
    expect(profile.salaryRule).toEqual({ kind: 'last_working_day' });
  });
});

describe('goal mapping', () => {
  it('requires a name and normalizes the mode', () => {
    const base = {
      id: TX_ID,
      user_id: USER,
      name: 'Emergency fund',
      contribution_mode: 'weird',
      created_at: 'x',
      updated_at: 'y',
    };

    expect(rowToGoal(base)?.mode).toBe('fixed');
    expect(rowToGoal({ ...base, name: '   ' })).toBeNull();
  });
});
