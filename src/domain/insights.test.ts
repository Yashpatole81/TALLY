import { categoryBreakdown, formatPercent, type InsightEntry, monthsWithActivity } from './insights';

const NOV = '2026-11';
const expense = (amountMinor: number, category: string | null, budgetMonth = NOV): InsightEntry => ({
  type: 'expense',
  amountMinor,
  budgetMonth,
  category,
});

describe('categoryBreakdown', () => {
  it('matches the Figma Insights breakdown', () => {
    const shares = categoryBreakdown(
      [
        expense(100_000, 'travel'),
        expense(280_000, 'food'),
        expense(150_000, 'shopping'),
        expense(170_000, 'bills'),
        { type: 'income', amountMinor: 1_600_000, budgetMonth: NOV, category: null },
      ],
      NOV
    );

    expect(shares.map((s) => s.categoryId)).toEqual(['food', 'bills', 'shopping', 'travel']);
    expect(shares.map((s) => formatPercent(s.percent))).toEqual(['40%', '24.3%', '21.4%', '14.3%']);
  });

  it('groups uncategorized and unknown categories under "other"', () => {
    const shares = categoryBreakdown([expense(100, null), expense(100, 'crypto'), expense(50, 'food')], NOV);

    expect(shares[0]).toMatchObject({ categoryId: 'other', amountMinor: 200 });
  });

  it('breaks ties using the category order', () => {
    const shares = categoryBreakdown([expense(100, 'travel'), expense(100, 'food')], NOV);

    expect(shares.map((s) => s.categoryId)).toEqual(['food', 'travel']);
  });

  it('returns nothing for a month without spending', () => {
    expect(categoryBreakdown([expense(100, 'food', '2026-10')], NOV)).toEqual([]);
  });
});

describe('monthsWithActivity', () => {
  it('lists months newest first and always includes the current month', () => {
    const months = monthsWithActivity(
      [expense(1, 'food', '2026-09'), expense(1, 'food', '2026-10'), { ...expense(1, 'food', '2026-08'), deleted: true }],
      NOV
    );

    expect(months).toEqual(['2026-11', '2026-10', '2026-09']);
  });
});
