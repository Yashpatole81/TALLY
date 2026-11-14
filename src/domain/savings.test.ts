import { autoMonthlyContribution, goalProgress, monthlyContribution, monthsRemainingInclusive } from './savings';

describe('auto contribution', () => {
  it('spreads what is left over the remaining months, rounded up to whole rupees', () => {
    // ₹30,000 target, ₹9,000 saved, Nov 2026 → Jun 2027 = 8 contribution months
    expect(monthsRemainingInclusive('2026-11', '2027-06')).toBe(8);
    expect(autoMonthlyContribution(3_000_000, 900_000, '2026-11', '2027-06')).toBe(262_500);
    expect(autoMonthlyContribution(1_000_000, 0, '2026-11', '2027-01')).toBe(333_400); // ₹3,333.33 → ₹3,334
  });

  it('stops once the goal is reached', () => {
    expect(autoMonthlyContribution(3_000_000, 3_000_000, '2026-11', '2027-06')).toBe(0);
  });

  it('asks for the full remainder when the target month has passed', () => {
    expect(autoMonthlyContribution(3_000_000, 900_000, '2026-11', '2026-09')).toBe(2_100_000);
  });
});

describe('monthlyContribution', () => {
  it('uses the fixed amount, capped by what is left to save', () => {
    const plan = { mode: 'fixed' as const, fixedMonthlyMinor: 300_000, targetMinor: 3_000_000, targetMonth: null };

    expect(monthlyContribution(plan, 900_000, '2026-11')).toBe(300_000);
    expect(monthlyContribution(plan, 2_900_000, '2026-11')).toBe(100_000);
    expect(monthlyContribution(plan, 3_000_000, '2026-11')).toBe(0);
  });

  it('keeps contributing to open-ended goals', () => {
    const plan = { mode: 'fixed' as const, fixedMonthlyMinor: 300_000, targetMinor: null, targetMonth: null };

    expect(monthlyContribution(plan, 50_000_000, '2026-11')).toBe(300_000);
  });

  it('returns 0 for an incomplete auto plan', () => {
    const plan = { mode: 'auto' as const, fixedMonthlyMinor: null, targetMinor: null, targetMonth: '2027-06' };

    expect(monthlyContribution(plan, 0, '2026-11')).toBe(0);
  });
});

describe('goalProgress', () => {
  it('matches the mock (₹9,000 of ₹30,000 = 30%)', () => {
    expect(goalProgress(900_000, 3_000_000)).toEqual({ percent: 30, fraction: 0.3 });
  });

  it('caps at 100% and handles open-ended goals', () => {
    expect(goalProgress(4_000_000, 3_000_000).percent).toBe(100);
    expect(goalProgress(900_000, null)).toEqual({ percent: null, fraction: 0 });
  });
});
