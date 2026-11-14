import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { useBusy } from '@/components/forms/use-busy';
import { Button } from '@/components/ui/button';
import { FieldMessage } from '@/components/ui/field-message';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { TextField, type TextInputRef } from '@/components/ui/text-field';
import { updatePassword } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { newPasswordSchema, type NewPasswordValues } from '@/validation/schemas';

/** Reached from the password reset link (recovery session). Not in the Figma, but follows its pattern. */
export default function NewPassword() {
  const confirmRef = useRef<TextInputRef>(null);
  const [formError, setFormError] = useState<string>();
  const [busy, run] = useBusy();
  const { control, handleSubmit } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    reValidateMode: 'onChange',
  });

  const submit = handleSubmit(
    ({ password }) =>
      run(async () => {
        setFormError(undefined);
        try {
          await updatePassword(password);
          haptics.success();
          router.replace('/');
        } catch (error) {
          haptics.error();
          setFormError(friendlyError(error));
        }
      }),
    () => haptics.error()
  );

  return (
    <Screen footer={<Button label="Save Password" onPress={submit} loading={busy} />}>
      <ScreenTitle
        title="Choose a new password."
        subtitle="Use at least 8 characters. You’ll stay signed in on this phone."
        className="mt-16"
      />
      <View className="mt-8 gap-5">
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="New Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="At least 8 characters"
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              maxLength={72}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              ref={confirmRef}
              label="Confirm Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Re-enter your password"
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
              maxLength={72}
            />
          )}
        />
      </View>
      <FieldMessage message={formError} />
    </Screen>
  );
}
