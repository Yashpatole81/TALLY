import { router } from 'expo-router';
import { View } from 'react-native';

import { useBusy } from '@/components/forms/use-busy';
import { SettingsRow } from '@/components/settings-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { flushSync, pendingChangeCount, signOut } from '@/data/actions';
import { useActiveGoal, useProfile } from '@/data/hooks';
import { formatDayMonth, formatMonthYear, monthKeyOf, monthName, todayISO } from '@/domain/dates';
import { CURRENCIES, formatMoney } from '@/domain/money';
import { describeAllocation, describeSalaryRule, fundingSalaryDate } from '@/domain/salary';
import { showAlert } from '@/lib/alert';
import { useSessionStore } from '@/stores/session-store';

/** Figma "Settings: built around your payday." */
export default function Settings() {
  const user = useSessionStore((state) => state.session?.user);
  const profile = useProfile(user?.id).data;
  const goal = useActiveGoal(user?.id).data ?? null;
  const [busy, run] = useBusy();
  if (!user || !profile) return null;

  const month = monthKeyOf(todayISO());
  const money = (value: number) => formatMoney(value, profile.currency);
  const funding = fundingSalaryDate(month, profile.salaryRule, profile.allocation);
  const goalValue = !goal
    ? 'Add a goal'
    : goal.mode === 'fixed' && goal.fixedMonthlyMinor
      ? `${goal.name} · ${money(goal.fixedMonthlyMinor)}/mo`
      : goal.targetMonth
        ? `${goal.name} · by ${formatMonthYear(goal.targetMonth)}`
        : goal.name;

  const logOut = () =>
    run(async () => {
      await flushSync(user.id); // last chance to save offline changes to the server
      const pending = await pendingChangeCount(user.id);
      const confirm = () => void signOut();
      if (pending > 0) {
        showAlert(
          'Some changes haven’t synced',
          `${pending} change${pending === 1 ? ' is' : 's are'} only on this phone. Logging out now deletes ${
            pending === 1 ? 'it' : 'them'
          }. Connect to the internet to keep ${pending === 1 ? 'it' : 'them'}.`,
          [
            { text: 'Stay signed in', style: 'cancel' },
            { text: 'Log out anyway', style: 'destructive', onPress: confirm },
          ]
        );
        return;
      }
      showAlert('Log out of Tally?', 'Your budget stays in your account. This phone’s copy is removed.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: confirm },
      ]);
    });

  return (
    <Screen edges={['top']}>
      <Text variant="heading" className="mt-4" accessibilityRole="header">
        Settings
      </Text>
      <Text variant="subtitle" className="mt-1">
        Built around your payday.
      </Text>

      <PressableScale
        onPress={() => router.push('/edit-profile')}
        accessibilityRole="button"
        accessibilityLabel={`${profile.fullName || 'Your profile'}, ${user.email ?? ''}`}
        accessibilityHint="Edit your profile"
        containerClassName="mt-6">
        <Card className="flex-row items-center px-5 py-5">
          <View className="flex-1 pr-3">
            <Text variant="section" numberOfLines={1}>
              {profile.fullName || 'Your profile'}
            </Text>
            <Text variant="subtitle" className="mt-1" numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <Text variant="subtitle">Edit</Text>
        </Card>
      </PressableScale>

      <SectionLabel className="mt-8">Salary & budget</SectionLabel>
      <Card className="px-5">
        <SettingsRow
          label="Monthly salary"
          value={money(profile.monthlySalaryMinor)}
          onPress={() => router.push('/edit-salary')}
        />
        <SettingsRow
          label="Salary credit date"
          value={describeSalaryRule(profile.salaryRule)}
          onPress={() => router.push('/edit-salary')}
        />
        <SettingsRow
          label="Budget cycle"
          value={describeAllocation(profile.allocation)}
          onPress={() => router.push('/edit-salary')}
          divider={false}
        />
        <View className="mb-4 rounded-control bg-subtle px-4 py-3">
          <Text variant="body">
            {formatDayMonth(funding)} salary → {monthName(month)} budget
          </Text>
          <Text variant="caption" className="mt-0.5">
            Your payday funds the month ahead.
          </Text>
        </View>
      </Card>

      <SectionLabel className="mt-8">Savings</SectionLabel>
      <Card className="px-5">
        <SettingsRow label="Savings goal" value={goalValue} onPress={() => router.push('/edit-goal')} divider={false} />
      </Card>

      <SectionLabel className="mt-8">Preferences</SectionLabel>
      <Card className="px-5">
        <SettingsRow
          label="Currency"
          value={`${profile.currency} · ${CURRENCIES[profile.currency].symbol.trim()}`}
          onPress={() => router.push('/edit-salary')}
        />
        <SettingsRow
          label="Notifications"
          value={profile.notificationsEnabled ? 'On' : 'Off'}
          onPress={() => router.push('/notifications')}
        />
        {/* No dark design exists yet, so the app is light-only for now (see decisions.md). */}
        <SettingsRow label="Appearance" value="Light" divider={false} />
      </Card>

      <View className="mt-6">
        <Button variant="secondary" label="Logout" onPress={logOut} loading={busy} />
      </View>
    </Screen>
  );
}
