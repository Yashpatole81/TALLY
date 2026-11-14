import { CryptoDigestAlgorithm, CryptoEncoding, digestStringAsync } from 'expo-crypto';

import { firstDayOfMonth, type ISODate, monthKeyOf, type MonthKey } from '@/domain/dates';
import { autoEntrySeed, uuidFromHexDigest } from '@/domain/ids';
import { fundingSalaryDate } from '@/domain/salary';
import { monthlyContribution } from '@/domain/savings';

import { getTransaction, nowIso, saveTransaction, savedTotal } from './repositories';
import type { Profile, SavingsGoal, Transaction } from './types';

/**
 * Salary and savings are recorded automatically once per budget month. IDs are derived from
 * (user, kind, month), so two offline devices produce the same row instead of duplicates.
 * A deleted auto entry stays deleted until the user edits the related setting again.
 */
async function autoEntryId(userId: string, kind: 'salary' | 'savings_contribution', month: MonthKey) {
  const digest = await digestStringAsync(CryptoDigestAlgorithm.SHA256, autoEntrySeed(userId, kind, month), {
    encoding: CryptoEncoding.HEX,
  });
  return uuidFromHexDigest(digest);
}

function salaryEntry(id: string, profile: Profile, month: MonthKey, existing: Transaction | null): Transaction {
  const now = nowIso();
  return {
    id,
    userId: profile.id,
    type: 'income',
    kind: 'salary',
    amountMinor: profile.monthlySalaryMinor,
    category: null,
    source: 'salary',
    note: null,
    goalId: null,
    occurredOn: fundingSalaryDate(month, profile.salaryRule, profile.allocation),
    budgetMonth: month,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  };
}

function savingsEntry(id: string, profile: Profile, goal: SavingsGoal, month: MonthKey, amountMinor: number, existing: Transaction | null): Transaction {
  const now = nowIso();
  return {
    id,
    userId: profile.id,
    type: 'savings',
    kind: 'savings_contribution',
    amountMinor,
    category: null,
    source: null,
    note: null,
    goalId: goal.id,
    occurredOn: firstDayOfMonth(month),
    budgetMonth: month,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  };
}

/** Creates this month's salary/savings entries if they've never existed. @returns whether anything was written. */
export async function ensureMonthlyEntries(profile: Profile, goal: SavingsGoal | null, today: ISODate): Promise<boolean> {
  if (!profile.onboardedAt) return false;
  const month = monthKeyOf(today);
  let changed = false;

  if (profile.monthlySalaryMinor > 0) {
    const id = await autoEntryId(profile.id, 'salary', month);
    if (!(await getTransaction(profile.id, id))) {
      await saveTransaction(salaryEntry(id, profile, month, null));
      changed = true;
    }
  }

  if (goal) {
    const id = await autoEntryId(profile.id, 'savings_contribution', month);
    if (!(await getTransaction(profile.id, id))) {
      const amount = monthlyContribution(goal, await savedTotal(profile.id, goal.id, month), month);
      if (amount > 0) {
        await saveTransaction(savingsEntry(id, profile, goal, month, amount, null));
        changed = true;
      }
    }
  }
  return changed;
}

/** After salary settings change, bring this month's auto salary entry in line (past months keep their history). */
export async function refreshSalaryEntry(profile: Profile, today: ISODate): Promise<void> {
  const month = monthKeyOf(today);
  const id = await autoEntryId(profile.id, 'salary', month);
  const existing = await getTransaction(profile.id, id);
  if (profile.monthlySalaryMinor <= 0) {
    if (existing && !existing.deletedAt) await saveTransaction({ ...existing, deletedAt: nowIso() });
    return;
  }
  await saveTransaction(salaryEntry(id, profile, month, existing));
}

/** After the goal is created, edited or removed, update this month's contribution to match. */
export async function refreshSavingsEntry(profile: Profile, goal: SavingsGoal | null, today: ISODate): Promise<void> {
  const month = monthKeyOf(today);
  const id = await autoEntryId(profile.id, 'savings_contribution', month);
  const existing = await getTransaction(profile.id, id);
  const amount = goal ? monthlyContribution(goal, await savedTotal(profile.id, goal.id, month), month) : 0;
  if (!goal || amount <= 0) {
    if (existing && !existing.deletedAt) await saveTransaction({ ...existing, deletedAt: nowIso() });
    return;
  }
  await saveTransaction(savingsEntry(id, profile, goal, month, amount, existing));
}
