import { router } from 'expo-router';

import { SalaryForm } from '@/components/forms/salary-form';
import { BackHeader } from '@/components/ui/screen';
import { saveSalarySettings } from '@/data/actions';
import { useProfile } from '@/data/hooks';
import { todayISO } from '@/domain/dates';
import { haptics } from '@/lib/haptics';
import { useUserId } from '@/stores/session-store';

export default function EditSalary() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  if (!userId || !profile) return null;
  const today = todayISO();
  return (
    <SalaryForm
      initial={profile}
      today={today}
      header={<BackHeader />}
      title="Salary & budget."
      subtitle="Changes apply from this month. Past months keep their history."
      submitLabel="Save"
      onSubmit={async (settings) => {
        await saveSalarySettings(userId, settings, today);
        haptics.success();
        router.back();
      }}
    />
  );
}
