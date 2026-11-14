import type { TransactionKind, TransactionType } from '@/domain/budget';
import type { ISODate, MonthKey } from '@/domain/dates';
import type { CurrencyCode } from '@/domain/money';
import type { BudgetAllocation, SalaryRule } from '@/domain/salary';
import type { ContributionMode } from '@/domain/savings';

/** App-level entities. Timestamps are UTC ISO strings, money is minor units. */
export interface Profile {
  id: string;
  fullName: string;
  /** Storage object path in the private `avatars` bucket (`<userId>/<file>`). */
  avatarPath: string | null;
  currency: CurrencyCode;
  monthlySalaryMinor: number;
  salaryRule: SalaryRule;
  allocation: BudgetAllocation;
  notificationsEnabled: boolean;
  onboardedAt: string | null;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  kind: TransactionKind;
  amountMinor: number;
  category: string | null;
  source: string | null;
  note: string | null;
  goalId: string | null;
  occurredOn: ISODate;
  budgetMonth: MonthKey;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetMinor: number | null;
  targetMonth: MonthKey | null;
  mode: ContributionMode;
  fixedMonthlyMinor: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type SyncedTable = 'profiles' | 'savings_goals' | 'transactions';
