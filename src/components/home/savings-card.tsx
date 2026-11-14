import { View } from 'react-native';

import type { SavingsGoal } from '@/data/types';
import { type CurrencyCode, formatMoney } from '@/domain/money';
import { goalProgress } from '@/domain/savings';

import { Card } from '../ui/card';
import { PressableScale } from '../ui/pressable-scale';
import { ProgressRing } from '../ui/progress';
import { Text } from '../ui/text';

interface SavingsCardProps {
  goal: SavingsGoal;
  savedMinor: number;
  thisMonthMinor: number;
  currency: CurrencyCode;
  onPress: () => void;
}

/** Savings goal progress (mock: REFERENCE/UI/home-with-savings-card.svg). */
export function SavingsCard({ goal, savedMinor, thisMonthMinor, currency, onPress }: SavingsCardProps) {
  const money = (value: number) => formatMoney(value, currency);
  const progress = goalProgress(savedMinor, goal.targetMinor);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Savings goal ${goal.name}`}
      accessibilityHint="Opens your savings goal">
      <Card className="flex-row items-center px-5 py-4">
        <ProgressRing
          fraction={progress.fraction}
          label={progress.percent === null ? `${money(savedMinor)} saved` : `${progress.percent}% of goal saved`}>
          <Text variant="rowTitle">{progress.percent === null ? '·' : `${progress.percent}%`}</Text>
        </ProgressRing>
        <View className="ml-4 flex-1">
          <Text variant="overline" numberOfLines={1}>
            Savings · {goal.name}
          </Text>
          <View className="mt-1.5 flex-row items-baseline gap-2">
            <Text variant="amount">{money(savedMinor)}</Text>
            {goal.targetMinor ? <Text variant="message" tone="muted">of {money(goal.targetMinor)}</Text> : null}
          </View>
          <Text variant="caption" className="mt-1">
            {thisMonthMinor > 0 ? `${money(thisMonthMinor)} set aside this month` : 'Nothing set aside this month'}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}
