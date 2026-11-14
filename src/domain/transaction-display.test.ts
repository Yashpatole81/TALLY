import { type DisplayTransaction, transactionSubtitle, transactionTitle } from './transaction-display';

const base: DisplayTransaction = {
  type: 'expense',
  kind: 'manual',
  occurredOn: '2026-11-04',
  budgetMonth: '2026-11',
  category: 'food',
  source: null,
  note: 'Grocery Shopping',
};

describe('transaction rows', () => {
  it('renders the Figma grocery row', () => {
    expect(transactionTitle(base)).toBe('Grocery Shopping');
    expect(transactionSubtitle(base)).toBe('4 Nov · Food & groceries');
  });

  it('falls back to the category label when there is no note', () => {
    expect(transactionTitle({ ...base, note: '  ' })).toBe('Food & groceries');
    expect(transactionTitle({ ...base, note: null, category: null })).toBe('Expense');
    expect(transactionSubtitle({ ...base, category: null })).toBe('4 Nov · Uncategorized');
  });

  it('renders the auto salary row', () => {
    const salary: DisplayTransaction = { ...base, type: 'income', kind: 'salary', occurredOn: '2026-10-30', category: null, note: null };

    expect(transactionTitle(salary)).toBe('Salary Received');
    expect(transactionSubtitle(salary)).toBe('30 Oct → November budget');
  });

  it('renders savings contributions with the goal name', () => {
    const savings: DisplayTransaction = {
      ...base,
      type: 'savings',
      kind: 'savings_contribution',
      occurredOn: '2026-11-01',
      category: null,
      note: null,
      goalName: 'Emergency fund',
    };

    expect(transactionTitle(savings)).toBe('Moved to Savings');
    expect(transactionSubtitle(savings)).toBe('1 Nov · Emergency fund');
  });

  it('renders manual income with its source', () => {
    const income: DisplayTransaction = { ...base, type: 'income', category: null, source: 'freelance', note: null };

    expect(transactionTitle(income)).toBe('Freelance');
    expect(transactionSubtitle(income)).toBe('4 Nov · Freelance');
  });
});
