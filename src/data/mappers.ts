import { isExpenseCategoryId, isIncomeSourceId } from '@/domain/categories';
import { isISODate, isMonthKey } from '@/domain/dates';
import { isUuid } from '@/domain/ids';
import { isCurrencyCode, MAX_AMOUNT_MINOR } from '@/domain/money';

import type { Profile, SavingsGoal, Transaction } from './types';

/**
 * Converts between snake_case rows (SQLite and Postgres share column names) and app entities.
 * Rows from the server or disk are treated as untrusted: invalid rows map to null and are skipped.
 */
type Row = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const int = (v: unknown): number | null => (typeof v === 'number' && Number.isSafeInteger(v) ? v : null);
const amount = (v: unknown): number | null => {
  // Postgres bigint can arrive as a string through PostgREST.
  const n = typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v;
  const value = int(n);
  return value !== null && value >= 0 && value <= MAX_AMOUNT_MINOR ? value : null;
};
const bool = (v: unknown): boolean => v === true || v === 1;

export function rowToProfile(row: Row): Profile | null {
  const id = str(row.id);
  const updatedAt = str(row.updated_at);
  if (!id || !isUuid(id) || !updatedAt) return null;
  const currency = str(row.currency) ?? 'INR';
  const day = int(row.salary_day);
  return {
    id,
    fullName: (str(row.full_name) ?? '').slice(0, 80),
    avatarPath: str(row.avatar_path),
    currency: isCurrencyCode(currency) ? currency : 'INR',
    monthlySalaryMinor: amount(row.monthly_salary_minor) ?? 0,
    salaryRule:
      row.salary_rule === 'custom_date' && day !== null && day >= 1 && day <= 31
        ? { kind: 'custom_date', day }
        : { kind: 'last_working_day' },
    allocation: row.budget_allocation === 'same_month' ? 'same_month' : 'following_month',
    notificationsEnabled: row.notifications_enabled === undefined ? true : bool(row.notifications_enabled),
    onboardedAt: str(row.onboarded_at),
    updatedAt,
  };
}

/** Columns shared by SQLite and Postgres. `asBoolean` is true for the server payload. */
export function profileToRow(profile: Profile, asBoolean: boolean): Row {
  return {
    id: profile.id,
    full_name: profile.fullName,
    avatar_path: profile.avatarPath,
    currency: profile.currency,
    monthly_salary_minor: profile.monthlySalaryMinor,
    salary_rule: profile.salaryRule.kind,
    salary_day: profile.salaryRule.kind === 'custom_date' ? profile.salaryRule.day : null,
    budget_allocation: profile.allocation,
    notifications_enabled: asBoolean ? profile.notificationsEnabled : profile.notificationsEnabled ? 1 : 0,
    onboarded_at: profile.onboardedAt,
    updated_at: profile.updatedAt,
  };
}

const TYPES = new Set(['expense', 'income', 'savings']);
const KINDS = new Set(['manual', 'salary', 'savings_contribution']);

export function rowToTransaction(row: Row): Transaction | null {
  const id = str(row.id);
  const userId = str(row.user_id);
  const type = str(row.type);
  const kind = str(row.kind) ?? 'manual';
  const amountMinor = amount(row.amount_minor);
  const occurredOn = str(row.occurred_on)?.slice(0, 10) ?? '';
  const budgetMonth = str(row.budget_month) ?? '';
  const createdAt = str(row.created_at);
  const updatedAt = str(row.updated_at);
  if (!id || !isUuid(id) || !userId || !type || !TYPES.has(type) || !KINDS.has(kind)) return null;
  if (amountMinor === null || amountMinor <= 0 || !isISODate(occurredOn) || !isMonthKey(budgetMonth)) return null;
  if (!createdAt || !updatedAt) return null;
  const category = str(row.category);
  const source = str(row.source);
  return {
    id,
    userId,
    type: type as Transaction['type'],
    kind: kind as Transaction['kind'],
    amountMinor,
    category: isExpenseCategoryId(category) ? category : null,
    source: isIncomeSourceId(source) ? source : null,
    note: str(row.note)?.slice(0, 60) ?? null,
    goalId: str(row.goal_id),
    occurredOn,
    budgetMonth,
    createdAt,
    updatedAt,
    deletedAt: str(row.deleted_at),
  };
}

export function transactionToRow(tx: Transaction): Row {
  return {
    id: tx.id,
    user_id: tx.userId,
    type: tx.type,
    kind: tx.kind,
    amount_minor: tx.amountMinor,
    category: tx.category,
    source: tx.source,
    note: tx.note,
    goal_id: tx.goalId,
    occurred_on: tx.occurredOn,
    budget_month: tx.budgetMonth,
    created_at: tx.createdAt,
    updated_at: tx.updatedAt,
    deleted_at: tx.deletedAt,
  };
}

export function rowToGoal(row: Row): SavingsGoal | null {
  const id = str(row.id);
  const userId = str(row.user_id);
  const name = str(row.name)?.trim();
  const createdAt = str(row.created_at);
  const updatedAt = str(row.updated_at);
  if (!id || !isUuid(id) || !userId || !name || !createdAt || !updatedAt) return null;
  const targetMonth = str(row.target_month);
  return {
    id,
    userId,
    name: name.slice(0, 60),
    targetMinor: amount(row.target_minor),
    targetMonth: targetMonth && isMonthKey(targetMonth) ? targetMonth : null,
    mode: row.contribution_mode === 'auto' ? 'auto' : 'fixed',
    fixedMonthlyMinor: amount(row.fixed_monthly_minor),
    createdAt,
    updatedAt,
    deletedAt: str(row.deleted_at),
  };
}

export function goalToRow(goal: SavingsGoal): Row {
  return {
    id: goal.id,
    user_id: goal.userId,
    name: goal.name,
    target_minor: goal.targetMinor,
    target_month: goal.targetMonth,
    contribution_mode: goal.mode,
    fixed_monthly_minor: goal.fixedMonthlyMinor,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
    deleted_at: goal.deletedAt,
  };
}
