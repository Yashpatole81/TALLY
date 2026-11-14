import {
  addDays,
  addMonths,
  calendarWeeks,
  dateToISO,
  dayOfWeek,
  daysInMonth,
  formatBudgetRange,
  formatDayMonth,
  formatDayMonthUpper,
  formatLongDate,
  formatMonthYear,
  isISODate,
  monthDiff,
  ordinal,
  parseISODate,
  relativeDayLabel,
} from './dates';

describe('calendar arithmetic', () => {
  it('knows month lengths including leap years', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('computes weekdays for the Figma dates', () => {
    expect(dayOfWeek(parseISODate('2026-10-31'))).toBe(6); // Saturday, so salary lands on Fri 30 Oct
    expect(dayOfWeek(parseISODate('2026-11-30'))).toBe(1); // Monday
  });

  it('shifts months across year boundaries', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', -13)).toBe('2025-10');
    expect(monthDiff('2026-11', '2027-06')).toBe(7);
  });

  it('shifts days across month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('validates ISO dates', () => {
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('2028-02-29')).toBe(true);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('26-1-1')).toBe(false);
    expect(() => parseISODate('nope')).toThrow('Invalid ISO date');
  });

  it('converts a JS Date using local calendar fields', () => {
    expect(dateToISO(new Date(2026, 10, 4, 23, 59))).toBe('2026-11-04');
  });
});

describe('labels', () => {
  it('formats the strings shown in the Figma', () => {
    expect(formatDayMonth('2026-10-30')).toBe('30 Oct');
    expect(formatDayMonth('2026-11-04')).toBe('4 Nov');
    expect(formatDayMonthUpper('2026-11-30')).toBe('30 NOV');
    expect(formatLongDate('2026-10-30')).toBe('30 October 2026');
    expect(formatMonthYear('2026-11')).toBe('November 2026');
    expect(formatBudgetRange('2026-11')).toBe('1 – 30 NOV');
  });

  it('labels today and yesterday relative to the current day', () => {
    expect(relativeDayLabel('2026-11-04', '2026-11-04')).toBe('Today, 4 Nov');
    expect(relativeDayLabel('2026-11-03', '2026-11-04')).toBe('Yesterday, 3 Nov');
    expect(relativeDayLabel('2026-11-01', '2026-11-04')).toBe('1 Nov');
  });

  it('builds ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 30, 31].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '30th', '31st',
    ]);
  });
});

describe('calendarWeeks', () => {
  it('matches the Figma October 2026 grid (Monday first, 28 Sep – 1 Nov)', () => {
    const weeks = calendarWeeks('2026-10');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toBe('2026-09-28');
    expect(weeks[4]![6]).toBe('2026-11-01');
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('adds a sixth row when the month needs it', () => {
    expect(calendarWeeks('2026-08')).toHaveLength(6); // 1 Aug 2026 is a Saturday
  });
});
