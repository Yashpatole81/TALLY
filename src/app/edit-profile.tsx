import { router } from 'expo-router';

import { PersonalDetailsForm } from '@/components/forms/personal-details-form';
import { BackHeader } from '@/components/ui/screen';
import { useProfile } from '@/data/hooks';
import { useSessionStore } from '@/stores/session-store';

export default function EditProfile() {
  const user = useSessionStore((state) => state.session?.user);
  const profile = useProfile(user?.id).data;
  if (!user || !profile) return null;
  return (
    <PersonalDetailsForm
      userId={user.id}
      email={user.email ?? ''}
      initialName={profile.fullName}
      initialAvatarPath={profile.avatarPath}
      header={<BackHeader />}
      title="Your profile."
      subtitle="This is how Tally greets you."
      submitLabel="Save"
      onDone={() => router.back()}
    />
  );
}
