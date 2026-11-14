import { randomUUID } from 'expo-crypto';

import type { TransactionType } from '@/domain/budget';
import { type ISODate, monthKeyOf, type MonthKey } from '@/domain/dates';
import type { CurrencyCode } from '@/domain/money';
import type { BudgetAllocation, SalaryRule } from '@/domain/salary';
import type { ContributionMode } from '@/domain/savings';
import { signOutRemote } from '@/lib/auth';
import {
  cancelSalaryReminders,
  requestReminderPermission,
  scheduleSalaryReminder,
} from '@/lib/notifications';

import { clearLocalData } from './db';
import { ensureMonthlyEntries, refreshSalaryEntry, refreshSavingsEntry } from './monthly-entries';
import { invalidateUser, queryClient } from './query-client';
import {
  deleteGoal,
  deleteTransaction,
  dirtyRows,
  getActiveGoal,
  getProfile,
  getTransaction,
  newProfile,
  nowIso,
  saveGoal,
  saveProfile,
  saveTransaction,
} from './repositories';
import { cancelScheduledSync, requestSync, runSync } from './sync-scheduler';
import type { Profile } from './types';

/**
 * User-intent operations. Each writes locally first, refreshes the UI, then schedules a sync.
 * They work offline. Ownership (`userId`) always comes from the signed-in session, never from input.
 */
async function afterWrite(userId: string): Promise<void> {
  await invalidateUser(userId);
  requestSync(userId);
}

async function requireProfile(userId: string): Promise<Profile> {
  const profile = await getProfile(userId);
  if (!profile) throw new Error('Profile not loaded yet. Please try again.');
  return profile;
}

// ---------------------------------------------------------------- profile & onboarding

export async function savePersonalDetails(userId: string, fullName: string, avatarPath?: string | null) {
  const profile = (await getProfile(userId)) ?? newProfile(userId, fullName);
  await saveProfile({ ...profile, fullName, avatarPath: avatarPath === undefined ? profile.avatarPath : avatarPath });
  await afterWrite(userId);
}

export interface SalarySettings {
  monthlySalaryMinor: number;
  salaryRule: SalaryRule;
  allocation: BudgetAllocation;
  currency: CurrencyCode;
}

export async function saveSalarySettings(userId: string, settings: SalarySettings, today: ISODate) {
  const next = { ...(await requireProfile(userId)), ...settings };
  await saveProfile(next);
  if (next.onboardedAt) {
    await refreshSalaryEntry(next, today);
    if (next.notificationsEnabled) await scheduleSalaryReminder(today, next.salaryRule, next.allocation).catch(() => undefined);
  }
  await afterWrite(userId);
}

export async function completeOnboarding(userId: string, today: ISODate) {
  const profile = await requireProfile(userId);
  const granted = await requestReminderPermission().catch(() => false);
  const next: Profile = { ...profile, onboardedAt: nowIso(), notificationsEnabled: granted };
  await saveProfile(next);
  await ensureMonthlyEntries(next, await getActiveGoal(userId), today);
  if (granted) await scheduleSalaryReminder(today, next.salaryRule, next.allocation).catch(() => undefined);
  await afterWrite(userId);
}

/** @returns false when the OS permission was refused (the setting stays off). */
export async function setNotificationsEnabled(userId: string, enabled: boolean, today: ISODate): Promise<boolean> {
  const profile = await requireProfile(userId);
  if (enabled) {
    if (!(await requestReminderPermission())) return false;
    await scheduleSalaryReminder(today, profile.salaryRule, profile.allocation);
  } else {
    await cancelSalaryReminders();
  }
  await saveProfile({ ...profile, notificationsEnabled: enabled });
  await afterWrite(userId);
  return true;
}

// ---------------------------------------------------------------- savings goal

export interface GoalInput {
  name: string;
  targetMinor: number | null;
  targetMonth: MonthKey | null;
  mode: ContributionMode;
  fixedMonthlyMinor: number | null;
}

export async function saveSavingsGoal(userId: string, input: GoalInput, today: ISODate) {
  const existing = await getActiveGoal(userId);
  const now = nowIso();
  const goal = {
    id: existing?.id ?? randomUUID(),
    userId,
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  };
  await saveGoal(goal);
  const profile = await getProfile(userId);
  if (profile?.onboardedAt) await refreshSavingsEntry(profile, goal, today);
  await afterWrite(userId);
}

export async function removeSavingsGoal(userId: string, today: ISODate) {
  const goal = await getActiveGoal(userId);
  if (!goal) return;
  await deleteGoal(goal);
  const profile = await getProfile(userId);
  if (profile?.onboardedAt) await refreshSavingsEntry(profile, null, today);
  await afterWrite(userId);
}

// ---------------------------------------------------------------- transactions

export interface TransactionInput {
  id?: string;
  type: Extract<TransactionType, 'expense' | 'income'>;
  amountMinor: number;
  occurredOn: ISODate;
  category: string | null;
  source: string | null;
  note: string;
}

export async function recordTransaction(userId: string, input: TransactionInput) {
  const existing = input.id ? await getTransaction(userId, input.id) : null;
  const now = nowIso();
  await saveTransaction({
    id: existing?.id ?? randomUUID(),
    userId,
    type: existing?.type === 'income' || existing?.type === 'expense' ? existing.type : input.type,
    kind: existing?.kind ?? 'manual',
    amountMinor: input.amountMinor,
    category: input.type === 'expense' ? input.category : null,
    source: input.type === 'income' ? input.source : null,
    note: input.note.trim() || null,
    goalId: existing?.goalId ?? null,
    occurredOn: input.occurredOn,
    // An auto salary entry keeps the month it funds. Manual entries follow their date.
    budgetMonth: existing?.kind === 'salary' ? existing.budgetMonth : monthKeyOf(input.occurredOn),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  });
  await afterWrite(userId);
}

export async function removeTransaction(userId: string, id: string) {
  await deleteTransaction(userId, id);
  await afterWrite(userId);
}

// ---------------------------------------------------------------- monthly upkeep & session

/** Records salary/savings when a new budget month starts (called on launch and foreground). */
export async function runMonthlyUpkeep(userId: string, today: ISODate) {
  const profile = await getProfile(userId);
  if (!profile) return;
  if (await ensureMonthlyEntries(profile, await getActiveGoal(userId), today)) await afterWrite(userId);
}

/** Rows written on this device that haven't reached the server yet. */
export async function pendingChangeCount(userId: string): Promise<number> {
  const counts = await Promise.all([
    dirtyRows('profiles', userId),
    dirtyRows('savings_goals', userId),
    dirtyRows('transactions', userId),
  ]);
  return counts.reduce((sum, rows) => sum + rows.length, 0);
}

export async function flushSync(userId: string) {
  await runSync(userId);
}

/** Signs out and wipes this device's copy: local DB, reminders, query cache. */
export async function signOut() {
  cancelScheduledSync();
  await signOutRemote().catch(() => undefined); // still clear locally if the network call fails
  await cancelSalaryReminders().catch(() => undefined);
  await clearLocalData();
  queryClient.clear();
}
