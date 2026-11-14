import { zodResolver } from '@hookform/resolvers/zod';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { savePersonalDetails } from '@/data/actions';
import { useAvatarUrl } from '@/data/hooks';
import { pickAvatar, removeAvatar, uploadAvatar } from '@/lib/avatar';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { personalDetailsSchema, type PersonalDetailsValues } from '@/validation/schemas';

import { Button } from '../ui/button';
import { FieldMessage } from '../ui/field-message';
import { Avatar } from '../ui/misc';
import { PressableScale } from '../ui/pressable-scale';
import { Screen, ScreenTitle } from '../ui/screen';
import { Text } from '../ui/text';
import { TextField } from '../ui/text-field';
import { useBusy } from './use-busy';

interface PersonalDetailsFormProps {
  userId: string;
  email: string;
  initialName: string;
  initialAvatarPath: string | null;
  header: React.ReactNode;
  title: string;
  subtitle: string;
  submitLabel: string;
  onDone: () => void;
}

/** Figma "Let’s get to know you." The photo is optional and private (signed URLs only). */
export function PersonalDetailsForm({
  userId,
  email,
  initialName,
  initialAvatarPath,
  header,
  title,
  subtitle,
  submitLabel,
  onDone,
}: PersonalDetailsFormProps) {
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [avatarError, setAvatarError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [busy, run] = useBusy();
  const existingAvatar = useAvatarUrl(initialAvatarPath);
  const { control, handleSubmit } = useForm<PersonalDetailsValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: { fullName: initialName },
    reValidateMode: 'onChange',
  });

  const choosePhoto = async () => {
    setAvatarError(undefined);
    try {
      const picked = await pickAvatar();
      if (picked) setAsset(picked);
    } catch {
      setAvatarError('Couldn’t open your photos. Check Tally’s photo permission in Settings.');
    }
  };

  const submit = handleSubmit(
    ({ fullName }) =>
      run(async () => {
        setFormError(undefined);
        let avatarPath: string | null | undefined;
        if (asset) {
          try {
            avatarPath = await uploadAvatar(userId, asset);
            if (initialAvatarPath) void removeAvatar(initialAvatarPath).catch(() => undefined);
          } catch (error) {
            // The photo is optional: say why, drop it, and let the next tap continue without it.
            haptics.error();
            setAsset(null);
            setAvatarError(error instanceof Error ? error.message : 'Couldn’t upload your photo.');
            return;
          }
        }
        try {
          await savePersonalDetails(userId, fullName, avatarPath);
          onDone();
        } catch (error) {
          haptics.error();
          setFormError(friendlyError(error));
        }
      }),
    () => haptics.error()
  );

  const name = initialName || email;
  return (
    <Screen footer={<Button label={submitLabel} onPress={submit} loading={busy} />}>
      {header}
      <ScreenTitle title={title} subtitle={subtitle} className="mt-4" />
      <PressableScale
        onPress={choosePhoto}
        accessibilityRole="button"
        accessibilityLabel="Add profile picture"
        accessibilityHint="Optional. Opens your photo library."
        containerClassName="mt-8 self-start"
        className="flex-row items-center gap-5">
        <Avatar name={name} uri={asset?.uri ?? existingAvatar.data} size={64} />
        <View>
          <Text variant="bodyMedium">{asset || initialAvatarPath ? 'Change profile picture' : 'Add profile picture'}</Text>
          <Text variant="message" tone="muted" className="mt-0.5">
            Optional · Make it yours
          </Text>
        </View>
      </PressableScale>
      <FieldMessage message={avatarError} />
      <View className="mt-8 gap-5">
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <TextField
              label="Full Name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Your full name"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={80}
            />
          )}
        />
        <TextField label="Email Address" value={email} readOnly accessibilityHint="Your sign-in email" />
      </View>
      <FieldMessage message={formError} />
    </Screen>
  );
}
