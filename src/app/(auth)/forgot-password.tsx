import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { useBusy } from '@/components/forms/use-busy';
import { Button } from '@/components/ui/button';
import { FieldMessage } from '@/components/ui/field-message';
import { BackHeader, Screen, ScreenTitle } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { sendPasswordReset } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/validation/schemas';

export default function ForgotPassword() {
  const [formError, setFormError] = useState<string>();
  const [busy, run] = useBusy();
  const { control, handleSubmit } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(
    ({ email }) =>
      run(async () => {
      setFormError(undefined);
      try {
        // Supabase answers the same way whether or not the email exists (no account enumeration).
        await sendPasswordReset(email);
        router.replace({ pathname: '/reset-email-sent', params: { email } });
      } catch (error) {
        haptics.error();
        setFormError(friendlyError(error));
      }
      }),
    () => haptics.error()
  );

  return (
    <Screen footer={<Button variant="link" label="Back to Sign In" onPress={() => router.replace('/sign-in')} />}>
      <BackHeader />
      <ScreenTitle
        title="Forgot your password?"
        subtitle="Enter your email address and we’ll send you a link to reset your password."
      />
      <View className="mt-8">
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email Address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="yash@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void onSubmit()}
              maxLength={254}
            />
          )}
        />
      </View>
      <FieldMessage message={formError} />
      <View className="mt-8">
        <Button label="Send Reset Link" onPress={onSubmit} loading={busy} />
      </View>
      <Text variant="message" tone="muted" className="mt-6">
        Use the email address linked to your account.
      </Text>
    </Screen>
  );
}
