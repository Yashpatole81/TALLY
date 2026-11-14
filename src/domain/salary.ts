import {
  addMonths,
  dayOfWeek,
  daysInMonth,
  formatDayMonth,
  type ISODate,
  monthKeyOf,
  type MonthKey,
  monthName,
  ordinal,
  parseMonthKey,
  toISODate,
} from './dates';

/** How the salary credit date is determined each month. */
export type SalaryRule = { kind: 'last_working_day' } | { kind: 'custom_date'; day: number };

/**
 * Which budget month a salary pays for.
 * - following_month: salary credited in October funds November (recommended in the Figma)
 * - same_month: salary credited in November funds November
 */
export type BudgetAllocation = 'following_month' | 'same_month';

/**
 * Salary credit date within `month`.
 * Last working day = last Monday–Friday (bank holidays are not modelled).
 * Custom day is clamped to the month's length (31 → 28/29 Feb, 30 Apr …).
 */
export function salaryDateInMonth(rule: SalaryRule, month: MonthKey): ISODate {
  const { year, month: m } = parseMonthKey(month);
  const lastDay = daysInMonth(year, m);
  if (rule.kind === 'custom_date') {
    const day = Math.min(Math.max(1, Math.trunc(rule.day)), lastDay);
    return toISODate({ year, month: m, day });
  }
  let day = lastDay;
  for (;;) {
    const weekday = dayOfWeek({ year, month: m, day });
    if (weekday !== 0 && weekday !== 6) break;
    day -= 1;
  }
  return toISODate({ year, month: m, day });
}

/** Month whose salary funds `budgetMonth`. */
export function fundingMonth(budgetMonth: MonthKey, allocation: BudgetAllocation): MonthKey {
  return allocation === 'following_month' ? addMonths(budgetMonth, -1) : budgetMonth;
}

/** Credit date of the salary that funds `budgetMonth` (e.g. 30 Oct for November). */
export function fundingSalaryDate(
  budgetMonth: MonthKey,
  rule: SalaryRule,
  allocation: BudgetAllocation
): ISODate {
  return salaryDateInMonth(rule, fundingMonth(budgetMonth, allocation));
}

/** First salary credit date on or after `today`. */
export function nextSalaryDate(today: ISODate, rule: SalaryRule): ISODate {
  const thisMonth = monthKeyOf(today);
  const candidate = salaryDateInMonth(rule, thisMonth);
  return candidate >= today ? candidate : salaryDateInMonth(rule, addMonths(thisMonth, 1));
}

/** "Last working day" | "30th of every month" */
export function describeSalaryRule(rule: SalaryRule): string {
  return rule.kind === 'last_working_day' ? 'Last working day' : `${ordinal(rule.day)} of every month`;
}

/** "Following month" | "Same month" */
export function describeAllocation(allocation: BudgetAllocation): string {
  return allocation === 'following_month' ? 'Following month' : 'Same month';
}

/** "Your October salary will be allocated to your November budget." */
export function allocationMessage(budgetMonth: MonthKey, allocation: BudgetAllocation): string {
  return `Your ${monthName(fundingMonth(budgetMonth, allocation))} salary will be allocated to your ${monthName(
    budgetMonth
  )} budget.`;
}

/** "30 Oct salary → November budget" */
export function fundingNote(budgetMonth: MonthKey, rule: SalaryRule, allocation: BudgetAllocation): string {
  return `${formatDayMonth(fundingSalaryDate(budgetMonth, rule, allocation))} salary → ${monthName(budgetMonth)} budget`;
}
