/** Expense categories. The first four come from the Figma; "other" catches uncategorized spend. */
export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & groceries', shortLabel: 'Food' },
  { id: 'bills', label: 'Bills & utilities', shortLabel: 'Bills' },
  { id: 'shopping', label: 'Shopping', shortLabel: 'Shopping' },
  { id: 'travel', label: 'Travel', shortLabel: 'Travel' },
  { id: 'other', label: 'Other', shortLabel: 'Other' },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id'];

/** Income sources for the Add Income sheet. Salary is also auto-recorded each budget month. */
export const INCOME_SOURCES = [
  { id: 'salary', label: 'Salary' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'refund', label: 'Refund' },
  { id: 'gift', label: 'Gift' },
  { id: 'other', label: 'Other' },
] as const;

export type IncomeSourceId = (typeof INCOME_SOURCES)[number]['id'];

const EXPENSE_IDS: ReadonlySet<string> = new Set(EXPENSE_CATEGORIES.map((c) => c.id));
const INCOME_IDS: ReadonlySet<string> = new Set(INCOME_SOURCES.map((s) => s.id));

export function isExpenseCategoryId(value: unknown): value is ExpenseCategoryId {
  return typeof value === 'string' && EXPENSE_IDS.has(value);
}

export function isIncomeSourceId(value: unknown): value is IncomeSourceId {
  return typeof value === 'string' && INCOME_IDS.has(value);
}

export function expenseCategory(id: ExpenseCategoryId) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)!;
}

export function incomeSource(id: IncomeSourceId) {
  return INCOME_SOURCES.find((s) => s.id === id)!;
}

/** Normalizes stored/unknown category values: anything unrecognized counts as "other". */
export function normalizeCategory(value: string | null | undefined): ExpenseCategoryId {
  return isExpenseCategoryId(value) ? value : 'other';
}
