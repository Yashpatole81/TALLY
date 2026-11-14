import { z } from 'zod';

import { isISODate, isMonthKey, type ISODate, type MonthKey } from '@/domain/dates';
import { CURRENCY_CODES, type CurrencyCode, MAX_AMOUNT_MINOR, parseAmountInput } from '@/domain/money';
import { autoMonthlyContribution } from '@/domain/savings';

/**
 * Client-side validation for every form. This is UX only. The same limits are enforced
 * server-side by Postgres CHECK constraints and RLS (see supabase/migrations).
 * Copy matches the Figma validation frames exactly.
 */
export const MESSAGES = {
  fullName: 'Enter your full name.',
  fullNameLength: 'Keep your name under 80 characters.',
  email: 'Enter a valid email address.',
  password: 'Enter your password.',
  passwordLength: 'Use at least 8 characters.',
  passwordMax: 'Use 72 characters or fewer.',
  passwordMatch: 'Passwords don’t match.',
  salary: 'Enter your monthly salary.',
  amount: 'Enter an amount.',
  amountTooLarge: 'That amount is too large.',
  customDay: 'Pick the day your salary arrives.',
  goalName: 'Give your goal a name.',
  goalNameLength: 'Keep the name under 60 characters.',
  goalMonthly: 'Enter how much to set aside.',
  goalTargetForAuto: 'Enter a target amount to plan automatically.',
  goalTargetMonth: 'Pick a target month.',
  goalOverSalary: 'Set aside less than your monthly salary.',
  date: 'Pick a date.',
  futureDate: 'Pick today or an earlier date.',
  noteLength: 'Keep the note under 60 characters.',
} as const;

const PASSWORD_MAX = 72; // bcrypt limit used by Supabase Auth

const emailField = z.string().trim().toLowerCase().max(254, MESSAGES.email).pipe(z.email(MESSAGES.email));

const fullNameField = z.string().trim().min(1, MESSAGES.fullName).max(80, MESSAGES.fullNameLength);

/** A typed amount string that must parse to 1…MAX minor units. */
const requiredAmount = (requiredMessage: string) =>
  z
    .string()
    .refine((value) => (parseAmountInput(value) ?? 0) > 0, requiredMessage)
    .refine((value) => (parseAmountInput(value) ?? 0) <= MAX_AMOUNT_MINOR, MESSAGES.amountTooLarge);

/** Runs object-level checks even when individual fields already failed (Figma shows all errors at once). */
const always = { when: () => true } as const;

const passwordsMatch = <T extends { password: string; confirmPassword: string }>(value: T) =>
  value.password === value.confirmPassword;

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, MESSAGES.password).max(PASSWORD_MAX, MESSAGES.passwordMax),
});
export type SignInValues = z.input<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    password: z.string().min(8, MESSAGES.passwordLength).max(PASSWORD_MAX, MESSAGES.passwordMax),
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, { message: MESSAGES.passwordMatch, path: ['confirmPassword'], ...always });
export type SignUpValues = z.input<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, MESSAGES.passwordLength).max(PASSWORD_MAX, MESSAGES.passwordMax),
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, { message: MESSAGES.passwordMatch, path: ['confirmPassword'], ...always });
export type NewPasswordValues = z.input<typeof newPasswordSchema>;

export const personalDetailsSchema = z.object({ fullName: fullNameField });
export type PersonalDetailsValues = z.input<typeof personalDetailsSchema>;

const currencyField = z.enum(CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]]);

export const salarySetupSchema = z
  .object({
    salary: requiredAmount(MESSAGES.salary),
    rule: z.enum(['last_working_day', 'custom_date']),
    customDay: z.number().int().min(1).max(31).nullable(),
    allocation: z.enum(['following_month', 'same_month']),
    currency: currencyField,
  })
  .refine((v) => v.rule !== 'custom_date' || v.customDay !== null, {
    message: MESSAGES.customDay,
    path: ['customDay'],
    ...always,
  });
export type SalarySetupValues = z.input<typeof salarySetupSchema>;

/**
 * Savings goal form. Needs the user's salary (a goal can't take more than the salary) and the
 * current budget month (auto plans can't target the past).
 */
export function makeSavingsGoalSchema(salaryMinor: number, currentMonth: MonthKey) {
  return z
    .object({
      name: z.string().trim().min(1, MESSAGES.goalName).max(60, MESSAGES.goalNameLength),
      target: z
        .string()
        .refine((v) => v.trim() === '' || (parseAmountInput(v) ?? 0) > 0, MESSAGES.amount)
        .refine((v) => (parseAmountInput(v) ?? 0) <= MAX_AMOUNT_MINOR, MESSAGES.amountTooLarge),
      mode: z.enum(['fixed', 'auto']),
      monthly: z.string(),
      targetMonth: z.string().nullable(),
    })
    .superRefine((v, ctx) => {
      const target = parseAmountInput(v.target);
      if (v.mode === 'fixed') {
        const monthly = parseAmountInput(v.monthly) ?? 0;
        if (monthly <= 0) ctx.addIssue({ code: 'custom', message: MESSAGES.goalMonthly, path: ['monthly'] });
        else if (monthly >= salaryMinor) {
          ctx.addIssue({ code: 'custom', message: MESSAGES.goalOverSalary, path: ['monthly'] });
        }
        return;
      }
      if (target === null || target <= 0) {
        ctx.addIssue({ code: 'custom', message: MESSAGES.goalTargetForAuto, path: ['target'] });
      }
      if (v.targetMonth === null || !isMonthKey(v.targetMonth) || v.targetMonth < currentMonth) {
        ctx.addIssue({ code: 'custom', message: MESSAGES.goalTargetMonth, path: ['targetMonth'] });
        return;
      }
      if (target !== null && target > 0) {
        const perMonth = autoMonthlyContribution(target, 0, currentMonth, v.targetMonth);
        if (perMonth >= salaryMinor) {
          ctx.addIssue({ code: 'custom', message: MESSAGES.goalOverSalary, path: ['targetMonth'] });
        }
      }
    }, always);
}
export type SavingsGoalValues = z.input<ReturnType<typeof makeSavingsGoalSchema>>;

/** Add/edit expense or income. `today` blocks future-dated entries. */
export function makeTransactionSchema(today: ISODate) {
  return z.object({
    amount: requiredAmount(MESSAGES.amount),
    date: z
      .string()
      .refine(isISODate, MESSAGES.date)
      .refine((d) => d <= today, MESSAGES.futureDate),
    category: z.string().nullable(),
    source: z.string().nullable(),
    note: z.string().trim().max(60, MESSAGES.noteLength),
  });
}
export type TransactionValues = z.input<ReturnType<typeof makeTransactionSchema>>;
