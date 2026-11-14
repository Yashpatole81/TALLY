/**
 * Calendar helpers that work on plain local-date strings, so budget math never depends on the
 * device timezone once a date has been captured.
 *
 * - `ISODate`  = 'YYYY-MM-DD' (a local calendar day)
 * - `MonthKey` = 'YYYY-MM'    (a budget month)
 */
export type ISODate = string;
export type MonthKey = string;

export interface DateParts {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Number of days in a month (`month` is 1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** True when `value` is a real calendar day in 'YYYY-MM-DD' form. */
export function isISODate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** @throws Error when `value` is not a valid ISO date. */
export function parseISODate(value: ISODate): DateParts {
  if (!isISODate(value)) throw new Error(`Invalid ISO date: ${value}`);
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

export function toISODate({ year, month, day }: DateParts): ISODate {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Converts a JS Date to the *local* calendar day it falls on. */
export function dateToISO(date: Date): ISODate {
  return toISODate({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
}

export function todayISO(now: Date = new Date()): ISODate {
  return dateToISO(now);
}

export function isMonthKey(value: string): boolean {
  const match = MONTH_KEY.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function monthKey(year: number, month: number): MonthKey {
  return `${year}-${pad2(month)}`;
}

/** @throws Error when `key` is not 'YYYY-MM'. */
export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  if (!isMonthKey(key)) throw new Error(`Invalid month key: ${key}`);
  const [year, month] = key.split('-').map(Number) as [number, number];
  return { year, month };
}

export function monthKeyOf(date: ISODate): MonthKey {
  return date.slice(0, 7);
}

/** Shifts a month key by `delta` months (negative goes back). */
export function addMonths(key: MonthKey, delta: number): MonthKey {
  const { year, month } = parseMonthKey(key);
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (((index % 12) + 12) % 12) + 1;
  return monthKey(nextYear, nextMonth);
}

/** Whole months from `from` to `to` (positive when `to` is later). */
export function monthDiff(from: MonthKey, to: MonthKey): number {
  const a = parseMonthKey(from);
  const b = parseMonthKey(to);
  return (b.year - a.year) * 12 + (b.month - a.month);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek({ year, month, day }: DateParts): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDays(date: ISODate, delta: number): ISODate {
  const { year, month, day } = parseISODate(date);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta));
  return toISODate({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
}

export function firstDayOfMonth(key: MonthKey): ISODate {
  return `${key}-01`;
}

export function lastDayOfMonth(key: MonthKey): ISODate {
  const { year, month } = parseMonthKey(key);
  return toISODate({ year, month, day: daysInMonth(year, month) });
}

export function monthName(key: MonthKey): string {
  return MONTH_NAMES[parseMonthKey(key).month - 1]!;
}

const shortMonth = (month: number) => MONTH_NAMES[month - 1]!.slice(0, 3);

/** "30 Oct" */
export function formatDayMonth(date: ISODate): string {
  const { month, day } = parseISODate(date);
  return `${day} ${shortMonth(month)}`;
}

/** "30 NOV" (Next salary chip) */
export function formatDayMonthUpper(date: ISODate): string {
  return formatDayMonth(date).toUpperCase();
}

/** "30 October 2026" */
export function formatLongDate(date: ISODate): string {
  const { year, month, day } = parseISODate(date);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** "30 November" */
export function formatDayFullMonth(date: ISODate): string {
  const { month, day } = parseISODate(date);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

/** "November 2026" */
export function formatMonthYear(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "1 – 30 NOV" (budget period label on Home) */
export function formatBudgetRange(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `1 – ${daysInMonth(year, month)} ${shortMonth(month).toUpperCase()}`;
}

/** "Today, 4 Nov" / "Yesterday, 3 Nov" / "2 Nov" */
export function relativeDayLabel(date: ISODate, today: ISODate): string {
  if (date === today) return `Today, ${formatDayMonth(date)}`;
  if (date === addDays(today, -1)) return `Yesterday, ${formatDayMonth(date)}`;
  return formatDayMonth(date);
}

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st … 31st */
export function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

/**
 * Weeks (rows of 7 ISO dates) that cover a month, Monday-first like the Figma calendar.
 * Leading/trailing days belong to the neighbouring months.
 */
export function calendarWeeks(key: MonthKey): ISODate[][] {
  const first = firstDayOfMonth(key);
  const last = lastDayOfMonth(key);
  const leading = (dayOfWeek(parseISODate(first)) + 6) % 7; // days since Monday
  const trailing = (7 - ((dayOfWeek(parseISODate(last)) + 6) % 7) - 1) % 7;
  const weeks: ISODate[][] = [];
  let cursor = addDays(first, -leading);
  const end = addDays(last, trailing);
  while (cursor <= end) {
    const week: ISODate[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
