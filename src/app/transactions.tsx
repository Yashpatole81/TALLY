import { SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openTransaction } from '@/components/open-transaction';
import { TransactionRow } from '@/components/transaction-row';
import { EmptyState } from '@/components/ui/misc';
import { BackHeader } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useActiveGoal, useProfile, useTransactions } from '@/data/hooks';
import type { Transaction } from '@/data/types';
import { formatMonthYear } from '@/domain/dates';
import { useUserId } from '@/stores/session-store';

/** "View all": every transaction, grouped by budget month, newest first. */
export default function Transactions() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const goal = useActiveGoal(userId).data ?? null;
  const all = useTransactions(userId, 'all').data ?? [];
  if (!profile) return null;

  const byMonth = new Map<string, Transaction[]>();
  for (const tx of all) byMonth.set(tx.budgetMonth, [...(byMonth.get(tx.budgetMonth) ?? []), tx]);
  const sections = [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([month, data]) => ({ key: month, title: formatMonthYear(month), data }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <SectionList
        sections={sections}
        keyExtractor={(tx) => tx.id}
        contentContainerClassName="px-6 pb-10"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View className="mb-2">
            <BackHeader />
            <Text variant="heading" className="mt-2" accessibilityRole="header">
              Transactions
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="mt-6">
            <EmptyState title="No transactions yet" message="Expenses and income you add will appear here." />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text variant="sectionLabel" className="mb-1 mt-6" accessibilityRole="header">
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => (
          <TransactionRow
            tx={item}
            currency={profile.currency}
            goal={goal}
            showDivider={index < section.data.length - 1}
            onPress={() => openTransaction(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}
