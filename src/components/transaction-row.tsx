import { View } from 'react-native';

import type { SavingsGoal, Transaction } from '@/data/types';
import { signedAmount } from '@/domain/budget';
import { type CurrencyCode, formatMoney } from '@/domain/money';
import { transactionSubtitle, transactionTitle } from '@/domain/transaction-display';

import { TransactionIcon } from './transaction-icon';
import { PressableScale } from './ui/pressable-scale';
import { Text } from './ui/text';

interface TransactionRowProps {
  tx: Transaction;
  currency: CurrencyCode;
  goal?: SavingsGoal | null;
  onPress?: () => void;
  /** Hairline under the text column, inset like the Figma list. */
  showDivider?: boolean;
}

/** Icon tile, title, "4 Nov · Food & groceries", signed amount (Figma Home). */
export function TransactionRow({ tx, currency, goal, onPress, showDivider = true }: TransactionRowProps) {
  const display = { ...tx, goalName: tx.goalId && goal?.id === tx.goalId ? goal.name : null };
  const title = transactionTitle(display);
  const subtitle = transactionSubtitle(display);
  const amount = formatMoney(signedAmount(tx), currency, { signed: true });
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}, ${amount}`}
      accessibilityHint={onPress ? 'Opens this transaction' : undefined}
      className="flex-row items-center">
      <TransactionIcon tx={tx} />
      <View className={`ml-3 flex-1 flex-row items-center py-3 ${showDivider ? 'border-b border-line' : ''}`}>
        <View className="flex-1 pr-3">
          <Text variant="body" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" numberOfLines={1} className="mt-0.5">
            {subtitle}
          </Text>
        </View>
        <Text variant="body">{amount}</Text>
      </View>
    </PressableScale>
  );
}
