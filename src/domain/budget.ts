import type { MonthKey } from './dates';

export type TransactionType = 'expense' | 'income' | 'savings';

/** Where an entry came from: typed by the user or recorded automatically each budget month. */
export type TransactionKind = 'manual' | 'salary' | 'savings_contribution';

export interface BudgetEntry {
  type: TransactionType;
  amountMinor: number;
  budgetMonth: MonthKey;
  deleted?: boolean;
}

export interface BudgetSummary {
  /** Salary + other income allocated to the month. */
  incomeMinor: number;
  /** Set aside for savings goals, taken off the top. */
  savingsMinor: number;
  /** income − savings: what the user may spend this month. */
  spendableMinor: number;
  spentMinor: number;
  /** spendable − spent; negative when overspent. */
  availableMinor: number;
  /** 0–100, rounded ("56% left"). */
  percentLeft: number;
  /** Rounded, may exceed 100 when overspent ("44% of your budget"). */
  percentSpent: number;
  /** 0–1 fill for the spent progress bar. */
  spentFraction: number;
  overspent: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Budget numbers for one month. Deleted entries and other months are ignored. */
export function summarizeBudget(entries: readonly BudgetEntry[], month: MonthKey): BudgetSummary {
  let incomeMinor = 0;
  let savingsMinor = 0;
  let spentMinor = 0;
  for (const entry of entries) {
    if (entry.deleted || entry.budgetMonth !== month) continue;
    if (entry.type === 'income') incomeMinor += entry.amountMinor;
    else if (entry.type === 'savings') savingsMinor += entry.amountMinor;
    else spentMinor += entry.amountMinor;
  }
  const spendableMinor = incomeMinor - savingsMinor;
  const availableMinor = spendableMinor - spentMinor;
  const hasBudget = spendableMinor > 0;
  return {
    incomeMinor,
    savingsMinor,
    spendableMinor,
    spentMinor,
    availableMinor,
    percentLeft: hasBudget ? clamp(Math.round((availableMinor / spendableMinor) * 100), 0, 100) : 0,
    percentSpent: hasBudget ? Math.round((spentMinor / spendableMinor) * 100) : spentMinor > 0 ? 100 : 0,
    spentFraction: hasBudget ? clamp(spentMinor / spendableMinor, 0, 1) : spentMinor > 0 ? 1 : 0,
    overspent: availableMinor < 0,
  };
}

/** Sign used for list display: money out is negative. */
export function signedAmount(entry: Pick<BudgetEntry, 'type' | 'amountMinor'>): number {
  return entry.type === 'income' ? entry.amountMinor : -entry.amountMinor;
}
