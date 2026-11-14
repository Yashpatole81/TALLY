import type { z } from 'zod';

import {
  makeSavingsGoalSchema,
  makeTransactionSchema,
  MESSAGES,
  salarySetupSchema,
  signInSchema,
  signUpSchema,
} from './schemas';

/** Flattens zod issues to { path: message } for readable assertions. */
function errorsOf(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
}

describe('signInSchema', () => {
  it('shows the Figma validation copy', () => {
    const errors = errorsOf(signInSchema.safeParse({ email: 'yash@example', password: '' }));

    expect(errors).toEqual({ email: MESSAGES.email, password: MESSAGES.password });
    expect(MESSAGES.email).toBe('Enter a valid email address.');
    expect(MESSAGES.password).toBe('Enter your password.');
  });

  it('normalizes the email', () => {
    const result = signInSchema.parse({ email: '  Yash@Example.com ', password: 'secret' });

    expect(result.email).toBe('yash@example.com');
  });
});

describe('signUpSchema', () => {
  it('reports every Figma error at once', () => {
    const errors = errorsOf(
      signUpSchema.safeParse({ fullName: ' ', email: 'yash@example.com', password: '1234', confirmPassword: '123456789' })
    );

    expect(errors).toEqual({
      fullName: 'Enter your full name.',
      password: 'Use at least 8 characters.',
      confirmPassword: 'Passwords don’t match.',
    });
  });

  it('accepts a valid account', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Yash',
      email: 'yash@example.com',
      password: 'correct horse',
      confirmPassword: 'correct horse',
    });

    expect(result.success).toBe(true);
  });

  it('enforces the bcrypt password limit', () => {
    const long = 'x'.repeat(73);
    const errors = errorsOf(
      signUpSchema.safeParse({ fullName: 'Yash', email: 'yash@example.com', password: long, confirmPassword: long })
    );

    expect(errors.password).toBe(MESSAGES.passwordMax);
  });
});

describe('salarySetupSchema', () => {
  const valid = {
    salary: '16,000',
    rule: 'last_working_day' as const,
    customDay: null,
    allocation: 'following_month' as const,
    currency: 'INR' as const,
  };

  it('accepts the Figma setup', () => {
    expect(salarySetupSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a positive salary', () => {
    expect(errorsOf(salarySetupSchema.safeParse({ ...valid, salary: '0' }))).toEqual({ salary: MESSAGES.salary });
  });

  it('requires a day for a custom credit date', () => {
    expect(errorsOf(salarySetupSchema.safeParse({ ...valid, rule: 'custom_date' }))).toEqual({
      customDay: MESSAGES.customDay,
    });
  });
});

describe('savings goal schema', () => {
  const schema = makeSavingsGoalSchema(1_600_000, '2026-11');
  const fixed = { name: 'Emergency fund', target: '30,000', mode: 'fixed' as const, monthly: '3,000', targetMonth: null };

  it('accepts the mock goal', () => {
    expect(schema.safeParse(fixed).success).toBe(true);
  });

  it('requires a name and a monthly amount', () => {
    expect(errorsOf(schema.safeParse({ ...fixed, name: '', monthly: '' }))).toEqual({
      name: MESSAGES.goalName,
      monthly: MESSAGES.goalMonthly,
    });
  });

  it('rejects setting aside the whole salary', () => {
    expect(errorsOf(schema.safeParse({ ...fixed, monthly: '16,000' }))).toEqual({ monthly: MESSAGES.goalOverSalary });
  });

  it('needs a target and a future month for auto plans', () => {
    const errors = errorsOf(schema.safeParse({ ...fixed, mode: 'auto', target: '', targetMonth: '2026-10' }));

    expect(errors).toEqual({ target: MESSAGES.goalTargetForAuto, targetMonth: MESSAGES.goalTargetMonth });
  });

  it('rejects auto plans that need more than the salary each month', () => {
    const errors = errorsOf(schema.safeParse({ ...fixed, mode: 'auto', target: '1,00,000', targetMonth: '2026-11' }));

    expect(errors).toEqual({ targetMonth: MESSAGES.goalOverSalary });
  });
});

describe('transaction schema', () => {
  const schema = makeTransactionSchema('2026-11-04');
  const valid = { amount: '1,200', date: '2026-11-04', category: 'food', source: null, note: 'Grocery Shopping' };

  it('accepts a valid expense', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('requires an amount and blocks future dates', () => {
    expect(errorsOf(schema.safeParse({ ...valid, amount: '0.00', date: '2026-11-05' }))).toEqual({
      amount: MESSAGES.amount,
      date: MESSAGES.futureDate,
    });
  });

  it('caps the amount and note length', () => {
    expect(errorsOf(schema.safeParse({ ...valid, amount: '999999999', note: 'x'.repeat(61) }))).toEqual({
      amount: MESSAGES.amountTooLarge,
      note: MESSAGES.noteLength,
    });
  });
});
