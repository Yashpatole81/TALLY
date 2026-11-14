import { router } from 'expo-router';

import { SavingsGoalForm } from '@/components/forms/savings-goal-form';
import { BackHeader } from '@/components/ui/screen';
import { saveSavingsGoal } from '@/data/actions';
import { useActiveGoal, useProfile } from '@/data/hooks';
import { todayISO } from '@/domain/dates';
import { useUserId } from '@/stores/session-store';

/** Onboarding 3 of 4 (new step, requested by the user). Optional, so the user can skip it. */
export default function SavingsGoalStep() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const goal = useActiveGoal(userId);
  if (!userId || !profile || !goal.isFetched) return null;
  const today = todayISO();

  return (
    <SavingsGoalForm
      initial={goal.data ?? null}
      salaryMinor={profile.monthlySalaryMinor}
      currency={profile.currency}
      today={today}
      header={<BackHeader step="3 of 4" />}
      title="What are you saving for?"
      subtitle="Set money aside before you spend. Optional."
      submitLabel="Continue"
      secondaryAction={{ label: 'Skip for now', onPress: () => router.push('/budget-confirmation') }}
      onSubmit={async (input) => {
        await saveSavingsGoal(userId, input, today);
        router.push('/budget-confirmation');
      }}
    />
  );
}
