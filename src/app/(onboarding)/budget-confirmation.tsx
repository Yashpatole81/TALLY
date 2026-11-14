import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useBusy } from '@/components/forms/use-busy';
import { Button } from '@/components/ui/button';
import { Card, Divider } from '@/components/ui/card';
import { FieldMessage } from '@/components/ui/field-message';
import { BackHeader, Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { completeOnboarding } from '@/data/actions';
import { useActiveGoal, useProfile } from '@/data/hooks';
import { formatDayFullMonth, formatMonthYear, monthKeyOf, todayISO } from '@/domain/dates';
import { formatMoney } from '@/domain/money';
import { nextSalaryDate } from '@/domain/salary';
import { monthlyContribution } from '@/domain/savings';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useUserId } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

/** Onboarding 4 of 4: "You’re all set." */
export default function BudgetConfirmationStep() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const goal = useActiveGoal(userId).data ?? null;
  const [error, setError] = useState<string>();
  const [busy, run] = useBusy();
  if (!userId || !profile) return null;

  const today = todayISO();
  const month = monthKeyOf(today);
  const savings = goal ? monthlyContribution(goal, 0, month) : 0;
  const money = (value: number) => formatMoney(value, profile.currency);
  const rows: [string, string][] = [
    ['Monthly salary', money(profile.monthlySalaryMinor)],
    ...(goal && savings > 0 ? ([[`Savings · ${goal.name}`, money(savings)]] as [string, string][]) : []),
    ['Budget month', formatMonthYear(month)],
    ['Next salary', formatDayFullMonth(nextSalaryDate(today, profile.salaryRule))],
  ];

  const finish = () =>
    run(async () => {
      setError(undefined);
      try {
        await completeOnboarding(userId, today); // the route guard switches to Home
        haptics.success();
      } catch (cause) {
        haptics.error();
        setError(friendlyError(cause));
      }
    });

  return (
    <Screen
      footer={
        <View className="gap-4">
          <Text variant="message" tone="muted" className="text-center">
            You can change these details in Settings.
          </Text>
          <Button label="Go to Home" onPress={finish} loading={busy} />
        </View>
      }>
      <BackHeader step="4 of 4" />
      <View className="mt-4 h-12 w-12 items-center justify-center rounded-full bg-surface">
        <Check size={24} color={colors.ink} strokeWidth={1.8} />
      </View>
      <Text variant="title" className="mt-6" accessibilityRole="header">
        You’re all set.
      </Text>
      <Text variant="subtitle" className="mt-2">
        Your monthly budget is ready.
      </Text>

      <Card className="mt-8 px-5 py-6">
        <Text variant="overline">Available monthly budget</Text>
        <Text variant="display" className="mt-3">
          {money(Math.max(0, profile.monthlySalaryMinor - savings))}
        </Text>
        <Text variant="subtitle" className="mt-1">
          {formatMonthYear(month)}
        </Text>
      </Card>

      <Card className="mt-6 px-5">
        {rows.map(([label, value], index) => (
          <View key={label}>
            {index > 0 ? <Divider /> : null}
            <View className="flex-row items-center justify-between py-4">
              <Text variant="body" tone="muted">
                {label}
              </Text>
              <Text variant="body">{value}</Text>
            </View>
          </View>
        ))}
      </Card>
      <FieldMessage message={error} />
    </Screen>
  );
}
