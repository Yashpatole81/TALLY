import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { BarRow } from '@/components/insights/bar-row';
import { ExpenseDonut } from '@/components/insights/expense-donut';
import { Card, Divider } from '@/components/ui/card';
import { Chip, EmptyState } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useProfile, useTransactions } from '@/data/hooks';
import { summarizeBudget } from '@/domain/budget';
import { expenseCategory } from '@/domain/categories';
import { formatMonthYear, monthKeyOf, monthName, type MonthKey, todayISO } from '@/domain/dates';
import { categoryBreakdown, monthsWithActivity } from '@/domain/insights';
import { formatMoney } from '@/domain/money';
import { useUserId } from '@/stores/session-store';
import { chartRamp, colors } from '@/theme/tokens';

/** Figma "Insights: where your salary goes." */
export default function Insights() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const all = useTransactions(userId, 'all').data ?? [];
  const currentMonth = monthKeyOf(todayISO());
  const [month, setMonth] = useState<MonthKey>(currentMonth);
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!profile) return null;

  const money = (value: number) => formatMoney(value, profile.currency);
  const months = monthsWithActivity(all, currentMonth);
  const monthEntries = all.filter((tx) => tx.budgetMonth === month);
  const summary = summarizeBudget(monthEntries, month);
  const shares = categoryBreakdown(monthEntries, month);
  const largest = shares[0]?.amountMinor ?? 0;
  const income = Math.max(summary.incomeMinor, 1);

  return (
    <Screen edges={['top']}>
      <View className="mt-4 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text variant="heading" accessibilityRole="header">
            Insights
          </Text>
          <Text variant="subtitle" className="mt-1">
            Where your salary goes.
          </Text>
        </View>
        <PressableScale
          onPress={() => setPickerOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={`Month: ${formatMonthYear(month)}`}
          accessibilityHint="Choose another month"
          accessibilityState={{ expanded: pickerOpen }}
          className="h-9 flex-row items-center gap-2 rounded-chip bg-surface px-4">
          <Text variant="label">{formatMonthYear(month)}</Text>
          <ChevronDown size={16} color={colors.muted} strokeWidth={1.8} />
        </PressableScale>
      </View>

      {pickerOpen ? (
        <View className="mt-4 flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
          {months.map((key) => (
            <Chip
              key={key}
              label={formatMonthYear(key)}
              selected={key === month}
              onPress={() => {
                setMonth(key);
                setPickerOpen(false);
              }}
            />
          ))}
        </View>
      ) : null}

      <Card className="mt-6 flex-row items-center justify-between px-5 py-5">
        <View>
          <Text variant="overline">Monthly spending</Text>
          <Text variant="display" className="mt-2">
            {money(summary.spentMinor)}
          </Text>
        </View>
        <Text variant="subtitle" className="max-w-[45%] text-right">
          {summary.percentSpent}% of your budget
        </Text>
      </Card>

      {shares.length === 0 ? (
        <View className="mt-4">
          <EmptyState title="No spending yet" message={`Expenses you add in ${monthName(month)} will show up here.`} />
        </View>
      ) : (
        <>
          <Card className="mt-4 px-5 py-5">
            <Text variant="section" className="mb-5">
              Expense breakdown
            </Text>
            <ExpenseDonut shares={shares} totalMinor={summary.spentMinor} currency={profile.currency} />
          </Card>

          <Card className="mt-4 gap-4 px-5 py-5">
            <Text variant="section" className="mb-1">
              Spending by category
            </Text>
            {shares.map((share, index) => (
              <BarRow
                key={share.categoryId}
                label={expenseCategory(share.categoryId).shortLabel}
                fraction={largest > 0 ? share.amountMinor / largest : 0}
                value={money(share.amountMinor)}
                color={chartRamp[Math.min(index, chartRamp.length - 1)]!}
              />
            ))}
          </Card>
        </>
      )}

      <Card className="mt-4 gap-4 px-5 py-5">
        <Text variant="section" className="mb-1">
          Your {monthName(month)} budget
        </Text>
        <BarRow label="Income" fraction={summary.incomeMinor > 0 ? 1 : 0} value={money(summary.incomeMinor)} color={chartRamp[0]} />
        {summary.savingsMinor > 0 ? (
          <BarRow label="Savings" fraction={summary.savingsMinor / income} value={money(summary.savingsMinor)} color={chartRamp[1]} />
        ) : null}
        <BarRow label="Expenses" fraction={summary.spentMinor / income} value={money(summary.spentMinor)} color={chartRamp[2]} />
        <Divider />
        <View className="flex-row items-center justify-between">
          <Text variant="subtitle">Remaining budget</Text>
          <Text variant="rowTitle">
            {money(summary.availableMinor)} · {summary.overspent ? 'over budget' : `${summary.percentLeft}% left`}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
