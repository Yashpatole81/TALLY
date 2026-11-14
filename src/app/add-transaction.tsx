import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { TransactionForm } from '@/components/forms/transaction-form';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useProfile, useTransaction } from '@/data/hooks';
import { todayISO } from '@/domain/dates';
import { isUuid } from '@/domain/ids';
import { useUserId } from '@/stores/session-store';

/** Native form sheet: /add-transaction?type=expense|income, or ?id=… to edit. */
export default function AddTransactionSheet() {
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const id = isUuid(params.id) ? params.id : undefined; // ignore malformed deep-link params
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const existing = useTransaction(userId, id);
  if (!userId || !profile || (id && !existing.isFetched)) return null;

  const tx = existing.data;
  if (id && (!tx || tx.deletedAt || tx.type === 'savings')) {
    return (
      <View className="flex-1 bg-surface px-6 pt-8">
        <Text variant="greeting">Not available</Text>
        <Text variant="subtitle" className="mb-6 mt-2">
          This transaction was removed or can’t be edited here.
        </Text>
        <Button label="Close" onPress={() => router.back()} />
      </View>
    );
  }
  const type = tx?.type === 'income' || (!tx && params.type === 'income') ? 'income' : 'expense';
  return (
    <TransactionForm
      key={id ?? type}
      userId={userId}
      currency={profile.currency}
      type={type}
      existing={tx ?? null}
      today={todayISO()}
    />
  );
}
