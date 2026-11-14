import { monthDiff, type MonthKey } from './dates';

/** fixed = user picks the monthly amount; auto = derived from target amount and target month. */
export type ContributionMode = 'fixed' | 'auto';

export interface SavingsPlan {
  targetMinor: number | null;
  targetMonth: MonthKey | null;
  mode: ContributionMode;
  fixedMonthlyMinor: number | null;
}

/** Contributions are rounded up to whole major units (₹) so the numbers read cleanly. */
const ROUNDING_STEP_MINOR = 100;

/** Contribution months from `current` through `target`, inclusive. At least 1. */
export function monthsRemainingInclusive(current: MonthKey, target: MonthKey): number {
  return Math.max(1, monthDiff(current, target) + 1);
}

/** Monthly amount needed to reach `targetMinor` by `targetMonth`. 0 once the goal is reached. */
export function autoMonthlyContribution(
  targetMinor: number,
  savedMinor: number,
  current: MonthKey,
  targetMonth: MonthKey
): number {
  const remaining = targetMinor - savedMinor;
  if (remaining <= 0) return 0;
  const perMonth = remaining / monthsRemainingInclusive(current, targetMonth);
  return Math.ceil(perMonth / ROUNDING_STEP_MINOR) * ROUNDING_STEP_MINOR;
}

/**
 * Amount to set aside this month. A fixed plan stops once the target is reached, and never
 * contributes more than what's left to save.
 */
export function monthlyContribution(plan: SavingsPlan, savedMinor: number, current: MonthKey): number {
  if (plan.mode === 'auto') {
    if (plan.targetMinor === null || plan.targetMonth === null) return 0;
    return autoMonthlyContribution(plan.targetMinor, savedMinor, current, plan.targetMonth);
  }
  const fixed = plan.fixedMonthlyMinor ?? 0;
  if (plan.targetMinor === null) return fixed;
  return Math.max(0, Math.min(fixed, plan.targetMinor - savedMinor));
}

/** Progress toward the target; `percent` is null for open-ended goals. */
export function goalProgress(savedMinor: number, targetMinor: number | null): { percent: number | null; fraction: number } {
  if (targetMinor === null || targetMinor <= 0) return { percent: null, fraction: 0 };
  const fraction = Math.min(1, Math.max(0, savedMinor / targetMinor));
  return { percent: Math.round(fraction * 100), fraction };
}
