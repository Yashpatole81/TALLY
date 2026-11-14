import { router } from 'expo-router';

import { SalaryForm } from '@/components/forms/salary-form';
import { BackHeader } from '@/components/ui/screen';
import { saveSalarySettings } from '@/data/actions';
import { useProfile } from '@/data/hooks';
import { todayISO } from '@/domain/dates';
import { useUserId } from '@/stores/session-store';

/** Onboarding 2 of 4. */
export default function SalarySetupStep() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  if (!userId || !profile) return null;
  const today = todayISO();

  return (
    <SalaryForm
      initial={profile}
      today={today}
      header={<BackHeader step="2 of 4" />}
      title="Set up your salary."
      subtitle="Let’s understand how your monthly budget works."
      submitLabel="Continue"
      onSubmit={async (settings) => {
        await saveSalarySettings(userId, settings, today);
        router.push('/savings-goal');
      }}
    />
  );
}
