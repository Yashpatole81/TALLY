import type { TransactionKind, TransactionType } from './budget';
import { expenseCategory, incomeSource, isExpenseCategoryId, isIncomeSourceId } from './categories';
import { formatDayMonth, type ISODate, type MonthKey, monthName } from './dates';

export interface DisplayTransaction {
  type: TransactionType;
  kind: TransactionKind;
  occurredOn: ISODate;
  budgetMonth: MonthKey;
  category: string | null;
  source: string | null;
  note: string | null;
  goalName?: string | null;
}

/** Row title: the user's note when present, otherwise a label from the category/source. */
export function transactionTitle(tx: DisplayTransaction): string {
  if (tx.kind === 'salary') return 'Salary Received';
  if (tx.kind === 'savings_contribution') return 'Moved to Savings';
  const note = tx.note?.trim();
  if (note) return note;
  if (tx.type === 'expense') return isExpenseCategoryId(tx.category) ? expenseCategory(tx.category).label : 'Expense';
  if (tx.type === 'income') return isIncomeSourceId(tx.source) ? incomeSource(tx.source).label : 'Income';
  return 'Savings';
}

/** Row subtitle, e.g. "4 Nov · Food & groceries" or "30 Oct → November budget". */
export function transactionSubtitle(tx: DisplayTransaction): string {
  const day = formatDayMonth(tx.occurredOn);
  if (tx.kind === 'salary') return `${day} → ${monthName(tx.budgetMonth)} budget`;
  if (tx.type === 'savings') return `${day} · ${tx.goalName?.trim() || 'Savings'}`;
  if (tx.type === 'expense') {
    return `${day} · ${isExpenseCategoryId(tx.category) ? expenseCategory(tx.category).label : 'Uncategorized'}`;
  }
  return `${day} · ${isIncomeSourceId(tx.source) ? incomeSource(tx.source).label : 'Income'}`;
}
