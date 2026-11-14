import { View } from 'react-native';

import type { BudgetSummary } from '@/domain/budget';
import { type CurrencyCode, formatMoney } from '@/domain/money';

import { Card } from '../ui/card';
import { ProgressBar } from '../ui/progress';
import { Text } from '../ui/text';

/** "AVAILABLE BALANCE ₹9,000 of ₹16,000 monthly budget" with the spent bar (Figma Home). */
export function BalanceCard({ summary, currency }: { summary: BudgetSummary; currency: CurrencyCode }) {
  const money = (value: number) => formatMoney(value, currency);
  const budgetLabel = summary.savingsMinor > 0 ? 'spendable budget' : 'monthly budget';
  return (
    <Card className="px-5 pb-6 pt-5">
      <Text variant="overline">Available balance</Text>
      <Text variant="display" className="mt-3" accessibilityLabel={`Available balance ${money(summary.availableMinor)}`}>
        {money(summary.availableMinor)}
      </Text>
      <Text variant="subtitle" className="mt-1">
        of {money(summary.spendableMinor)} {budgetLabel}
      </Text>
      <View className="mt-5">
        <ProgressBar fraction={summary.spentFraction} label={`${summary.percentSpent}% of budget spent`} />
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <Text variant="rowTitle">{money(summary.spentMinor)} spent</Text>
        <Text variant="message" tone="muted">
          {summary.overspent ? 'Over budget' : `${summary.percentLeft}% left`}
        </Text>
      </View>
    </Card>
  );
}
