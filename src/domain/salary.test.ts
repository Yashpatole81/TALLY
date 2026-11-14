import {
  allocationMessage,
  describeSalaryRule,
  fundingMonth,
  fundingNote,
  fundingSalaryDate,
  nextSalaryDate,
  salaryDateInMonth,
  type SalaryRule,
} from './salary';

const lastWorkingDay: SalaryRule = { kind: 'last_working_day' };

describe('salaryDateInMonth', () => {
  it('moves the last working day back over weekends', () => {
    expect(salaryDateInMonth(lastWorkingDay, '2026-10')).toBe('2026-10-30'); // 31st is a Saturday
    expect(salaryDateInMonth(lastWorkingDay, '2026-05')).toBe('2026-05-29'); // 31st is a Sunday
    expect(salaryDateInMonth(lastWorkingDay, '2026-11')).toBe('2026-11-30'); // Monday
  });

  it('clamps a custom day to the month length', () => {
    expect(salaryDateInMonth({ kind: 'custom_date', day: 31 }, '2026-02')).toBe('2026-02-28');
    expect(salaryDateInMonth({ kind: 'custom_date', day: 31 }, '2028-02')).toBe('2028-02-29');
    expect(salaryDateInMonth({ kind: 'custom_date', day: 30 }, '2026-10')).toBe('2026-10-30');
    expect(salaryDateInMonth({ kind: 'custom_date', day: 1 }, '2026-11')).toBe('2026-11-01');
  });
});

describe('budget allocation', () => {
  it('funds November with the 30 Oct salary when allocating to the following month', () => {
    expect(fundingMonth('2026-11', 'following_month')).toBe('2026-10');
    expect(fundingSalaryDate('2026-11', lastWorkingDay, 'following_month')).toBe('2026-10-30');
  });

  it('funds the same month when allocating to the same month', () => {
    expect(fundingSalaryDate('2026-11', lastWorkingDay, 'same_month')).toBe('2026-11-30');
  });

  it('produces the Figma copy', () => {
    expect(allocationMessage('2026-11', 'following_month')).toBe(
      'Your October salary will be allocated to your November budget.'
    );
    expect(fundingNote('2026-11', lastWorkingDay, 'following_month')).toBe('30 Oct salary → November budget');
  });
});

describe('nextSalaryDate', () => {
  it('shows 30 Nov on 4 Nov (Figma Home)', () => {
    expect(nextSalaryDate('2026-11-04', lastWorkingDay)).toBe('2026-11-30');
  });

  it('counts payday itself as the next salary', () => {
    expect(nextSalaryDate('2026-11-30', lastWorkingDay)).toBe('2026-11-30');
  });

  it('rolls into next month after payday', () => {
    expect(nextSalaryDate('2026-12-01', lastWorkingDay)).toBe('2026-12-31'); // Thursday
    expect(nextSalaryDate('2026-10-31', lastWorkingDay)).toBe('2026-11-30');
  });
});

describe('describeSalaryRule', () => {
  it('describes both rules', () => {
    expect(describeSalaryRule(lastWorkingDay)).toBe('Last working day');
    expect(describeSalaryRule({ kind: 'custom_date', day: 30 })).toBe('30th of every month');
  });
});
