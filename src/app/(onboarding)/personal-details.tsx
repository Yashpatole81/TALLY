import { router } from 'expo-router';

import { PersonalDetailsForm } from '@/components/forms/personal-details-form';
import { BackHeader } from '@/components/ui/screen';
import { signOut } from '@/data/actions';
import { useProfile } from '@/data/hooks';
import { showAlert } from '@/lib/alert';
import { useSessionStore } from '@/stores/session-store';

/** Onboarding 1 of 4. Back means leaving setup, which signs out (nothing to go back to). */
export default function PersonalDetailsStep() {
  const user = useSessionStore((state) => state.session?.user);
  const profile = useProfile(user?.id);
  if (!user || !profile.isFetched) return null;

  const leave = () =>
    showAlert('Leave setup?', 'You’ll be signed out. Your account stays, so you can sign in later.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <PersonalDetailsForm
      userId={user.id}
      email={user.email ?? ''}
      initialName={profile.data?.fullName ?? ''}
      initialAvatarPath={profile.data?.avatarPath ?? null}
      header={<BackHeader step="1 of 4" onBack={leave} />}
      title="Let’s get to know you."
      subtitle="A few details to personalize your experience."
      submitLabel="Continue"
      onDone={() => router.push('/salary-setup')}
    />
  );
}
