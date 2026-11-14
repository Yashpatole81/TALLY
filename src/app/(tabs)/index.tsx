import { router } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { BalanceCard } from '@/components/home/balance-card';
import { SavingsCard } from '@/components/home/savings-card';
import { openTransaction } from '@/components/open-transaction';
import { TransactionRow } from '@/components/transaction-row';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useActiveGoal, useProfile, useSavedTotal, useTransactions } from '@/data/hooks';
import { summarizeBudget } from '@/domain/budget';
import {
    formatBudgetRange,
    formatDayMonth,
    formatDayMonthUpper,
    formatMonthYear,
    monthKeyOf,
    todayISO,
} from '@/domain/dates';
import { fundingSalaryDate, nextSalaryDate } from '@/domain/salary';
import { useUserId } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

const RECENT_LIMIT = 5;

/** Figma "Home": greeting, next salary, available balance, savings, actions, recent transactions. */
export default function Home() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const goal = useActiveGoal(userId).data ?? null;
  const today = todayISO();
  const month = monthKeyOf(today);
  const transactions = useTransactions(userId, month).data ?? [];
  const saved = useSavedTotal(userId, goal?.id).data ?? 0;
  if (!profile) return null;

  const summary = summarizeBudget(transactions, month);
  const firstName = profile.fullName.trim().split(/\s+/)[0];
  const thisMonthSavings = transactions
    .filter((tx) => tx.type === 'savings' && tx.goalId === goal?.id)
    .reduce((sum, tx) => sum + tx.amountMinor, 0);
  const recent = transactions.slice(0, RECENT_LIMIT);

  return (
    <Screen edges={['top']}>
      <View className="mt-4 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text variant="greeting" accessibilityRole="header">
            {firstName ? `Hello, ${firstName} 👋` : 'Hello 👋'}
          </Text>
          <Text variant="caption" className="mt-1">
            Here’s your monthly overview.
          </Text>
        </View>
        <View
          className="items-center rounded-chip bg-surface px-4 py-2.5"
          accessible
          accessibilityLabel={`Next salary ${formatDayMonth(nextSalaryDate(today, profile.salaryRule))}`}>
          <Text variant="micro">Next salary</Text>
          <Text variant="rowTitle" className="mt-0.5">
            {formatDayMonthUpper(nextSalaryDate(today, profile.salaryRule))}
          </Text>
        </View>
      </View>

      <View className="mb-4 mt-8 flex-row items-center justify-between">
        <Text variant="section">{formatMonthYear(month)}</Text>
        <Text variant="overline">{formatBudgetRange(month)}</Text>
      </View>

      <BalanceCard summary={summary} currency={profile.currency} />

      {goal ? (
        <View className="mt-3">
          <SavingsCard
            goal={goal}
            savedMinor={saved}
            thisMonthMinor={thisMonthSavings}
            currency={profile.currency}
            onPress={() => router.push('/edit-goal')}
          />
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <Button
          className="flex-1"
          label="+ Add Expense"
          onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'expense' } })}
        />
        <Button
          className="flex-1"
          variant="secondary"
          label="+ Add Income"
          onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'income' } })}
        />
      </View>

      <View className="mt-5 flex-row items-center gap-3">
        <Wallet size={18} color={colors.icon} strokeWidth={1.6} />
        <Text variant="message" tone="muted">
          Funded by your {formatDayMonth(fundingSalaryDate(month, profile.salaryRule, profile.allocation))} salary
        </Text>
      </View>

      <View className="mb-1 mt-8 flex-row items-center justify-between">
        <Text variant="section" accessibilityRole="header">
          Recent Transactions
        </Text>
        <Pressable onPress={() => router.push('/transactions')} hitSlop={12} accessibilityRole="link">
          <Text variant="subtitle">View all</Text>
        </Pressable>
      </View>
      {recent.length === 0 ? (
        <View className="mt-3">
          <EmptyState title="No transactions yet" message="Add your first expense to see where your salary goes." />
        </View>
      ) : (
        recent.map((tx, index) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            currency={profile.currency}
            goal={goal}
            showDivider={index < recent.length - 1}
            onPress={() => openTransaction(tx)}
          />
        ))
      )}
    </Screen>
  );
}
