import { type BudgetEntry, signedAmount, summarizeBudget } from './budget';

const NOV = '2026-11';

/** The Figma Home/Insights scenario: ₹16,000 salary, ₹7,000 spent. */
const figmaMonth: BudgetEntry[] = [
  { type: 'income', amountMinor: 1_600_000, budgetMonth: NOV },
  { type: 'expense', amountMinor: 280_000, budgetMonth: NOV },
  { type: 'expense', amountMinor: 170_000, budgetMonth: NOV },
  { type: 'expense', amountMinor: 150_000, budgetMonth: NOV },
  { type: 'expense', amountMinor: 100_000, budgetMonth: NOV },
];

describe('summarizeBudget', () => {
  it('reproduces the Figma numbers', () => {
    const summary = summarizeBudget(figmaMonth, NOV);

    expect(summary.spendableMinor).toBe(1_600_000);
    expect(summary.spentMinor).toBe(700_000);
    expect(summary.availableMinor).toBe(900_000);
    expect(summary.percentLeft).toBe(56);
    expect(summary.percentSpent).toBe(44);
    expect(summary.spentFraction).toBeCloseTo(0.4375);
    expect(summary.overspent).toBe(false);
  });

  it('takes savings off the top (₹16,000 − ₹3,000 = ₹13,000 spendable)', () => {
    const summary = summarizeBudget(
      [...figmaMonth, { type: 'savings', amountMinor: 300_000, budgetMonth: NOV }],
      NOV
    );

    expect(summary.savingsMinor).toBe(300_000);
    expect(summary.spendableMinor).toBe(1_300_000);
    expect(summary.availableMinor).toBe(600_000);
    expect(summary.percentLeft).toBe(46);
  });

  it('reports overspending', () => {
    const summary = summarizeBudget(
      [...figmaMonth, { type: 'expense', amountMinor: 1_000_000, budgetMonth: NOV }],
      NOV
    );

    expect(summary.availableMinor).toBe(-100_000);
    expect(summary.percentLeft).toBe(0);
    expect(summary.percentSpent).toBe(106);
    expect(summary.spentFraction).toBe(1);
    expect(summary.overspent).toBe(true);
  });

  it('ignores deleted entries and other months', () => {
    const summary = summarizeBudget(
      [
        ...figmaMonth,
        { type: 'expense', amountMinor: 50_000, budgetMonth: NOV, deleted: true },
        { type: 'expense', amountMinor: 999_999, budgetMonth: '2026-10' },
      ],
      NOV
    );

    expect(summary.spentMinor).toBe(700_000);
  });

  it('handles a month with no income', () => {
    const empty = summarizeBudget([], NOV);
    expect(empty).toMatchObject({ spendableMinor: 0, percentLeft: 0, percentSpent: 0, spentFraction: 0 });

    const spendingOnly = summarizeBudget([{ type: 'expense', amountMinor: 100, budgetMonth: NOV }], NOV);
    expect(spendingOnly).toMatchObject({ percentSpent: 100, spentFraction: 1, overspent: true });
  });
});

describe('signedAmount', () => {
  it('makes money out negative', () => {
    expect(signedAmount({ type: 'expense', amountMinor: 120_000 })).toBe(-120_000);
    expect(signedAmount({ type: 'savings', amountMinor: 300_000 })).toBe(-300_000);
    expect(signedAmount({ type: 'income', amountMinor: 1_600_000 })).toBe(1_600_000);
  });
});
