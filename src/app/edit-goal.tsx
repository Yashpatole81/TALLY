import { router } from 'expo-router';

import { SavingsGoalForm } from '@/components/forms/savings-goal-form';
import { BackHeader } from '@/components/ui/screen';
import { removeSavingsGoal, saveSavingsGoal } from '@/data/actions';
import { useActiveGoal, useProfile, useSavedTotal, useTransactions } from '@/data/hooks';
import { monthKeyOf, todayISO } from '@/domain/dates';
import { showAlert } from '@/lib/alert';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useUserId } from '@/stores/session-store';

export default function EditGoal() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const goal = useActiveGoal(userId);
  const today = todayISO();
  const month = monthKeyOf(today);
  const total = useSavedTotal(userId, goal.data?.id).data ?? 0;
  const thisMonth = (useTransactions(userId, month).data ?? [])
    .filter((tx) => tx.type === 'savings' && tx.goalId === goal.data?.id)
    .reduce((sum, tx) => sum + tx.amountMinor, 0);
  if (!userId || !profile || !goal.isFetched) return null;
  const existing = goal.data ?? null;

  const remove = () =>
    showAlert(
      'Remove this goal?',
      'This month’s set-aside goes back into your budget. Past months stay as they were.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            void removeSavingsGoal(userId, today)
              .then(() => {
                haptics.heavy();
                router.back();
              })
              .catch((error: unknown) => {
                haptics.error();
                showAlert('Couldn’t remove the goal', friendlyError(error));
              }),
        },
      ]
    );

  return (
    <SavingsGoalForm
      initial={existing}
      savedMinor={total - thisMonth}
      salaryMinor={profile.monthlySalaryMinor}
      currency={profile.currency}
      today={today}
      header={<BackHeader />}
      title={existing ? 'Your savings goal.' : 'What are you saving for?'}
      subtitle="Set money aside before you spend."
      submitLabel="Save Goal"
      secondaryAction={existing ? { label: 'Remove goal', onPress: remove } : undefined}
      onSubmit={async (input) => {
        await saveSavingsGoal(userId, input, today);
        haptics.success();
        router.back();
      }}
    />
  );
}
