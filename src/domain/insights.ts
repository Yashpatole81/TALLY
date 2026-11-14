import type { BudgetEntry } from './budget';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId, normalizeCategory } from './categories';
import type { MonthKey } from './dates';

export interface InsightEntry extends BudgetEntry {
  category: string | null;
}

export interface CategoryShare {
  categoryId: ExpenseCategoryId;
  amountMinor: number;
  /** Share of the month's spending, rounded to one decimal (24.3). */
  percent: number;
}

const CATEGORY_ORDER = new Map(EXPENSE_CATEGORIES.map((c, index) => [c.id, index]));

/** Spending per category for a month, largest first (ties keep the Figma category order). */
export function categoryBreakdown(entries: readonly InsightEntry[], month: MonthKey): CategoryShare[] {
  const totals = new Map<ExpenseCategoryId, number>();
  let total = 0;
  for (const entry of entries) {
    if (entry.deleted || entry.type !== 'expense' || entry.budgetMonth !== month) continue;
    const id = normalizeCategory(entry.category);
    totals.set(id, (totals.get(id) ?? 0) + entry.amountMinor);
    total += entry.amountMinor;
  }
  if (total === 0) return [];
  return [...totals.entries()]
    .map(([categoryId, amountMinor]) => ({
      categoryId,
      amountMinor,
      percent: Math.round((amountMinor / total) * 1000) / 10,
    }))
    .sort(
      (a, b) =>
        b.amountMinor - a.amountMinor ||
        (CATEGORY_ORDER.get(a.categoryId) ?? 0) - (CATEGORY_ORDER.get(b.categoryId) ?? 0)
    );
}

/** 40 → "40%", 24.3 → "24.3%" */
export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

/** Budget months that have any non-deleted entry, newest first (always includes `current`). */
export function monthsWithActivity(entries: readonly BudgetEntry[], current: MonthKey): MonthKey[] {
  const months = new Set<MonthKey>([current]);
  for (const entry of entries) if (!entry.deleted) months.add(entry.budgetMonth);
  return [...months].sort().reverse();
}
