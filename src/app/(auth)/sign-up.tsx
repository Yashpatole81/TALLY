import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { useBusy } from '@/components/forms/use-busy';
import { AuthFooter } from '@/components/auth-footer';
import { Button } from '@/components/ui/button';
import { FieldMessage } from '@/components/ui/field-message';
import { GoogleMark, OrDivider } from '@/components/ui/misc';
import { BackHeader, Screen, ScreenTitle } from '@/components/ui/screen';
import { TextField, type TextInputRef } from '@/components/ui/text-field';
import { signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { signUpSchema, type SignUpValues } from '@/validation/schemas';

export default function SignUp() {
  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);
  const confirmRef = useRef<TextInputRef>(null);
  const [formError, setFormError] = useState<string>();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [busy, run] = useBusy();
  const { control, handleSubmit } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(
    ({ fullName, email, password }) =>
      run(async () => {
      setFormError(undefined);
      try {
        const { needsConfirmation } = await signUpWithEmail(fullName, email, password);
        if (needsConfirmation) router.replace({ pathname: '/check-email', params: { email } });
      } catch (error) {
        haptics.error();
        setFormError(friendlyError(error));
      }
      }),
    () => haptics.error()
  );

  const onGoogle = async () => {
    setFormError(undefined);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      haptics.error();
      setFormError(friendlyError(error));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <AuthFooter prompt="Already have an account?" action="Sign In" onPress={() => router.replace('/sign-in')} />
      }>
      <BackHeader />
      <ScreenTitle title="Create your account." subtitle="A fresh start for your monthly budget." />
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
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              maxLength={80}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              ref={emailRef}
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
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              maxLength={254}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              ref={passwordRef}
              label="Password"
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
              onSubmitEditing={() => void onSubmit()}
              maxLength={72}
            />
          )}
        />
      </View>
      <FieldMessage message={formError} />
      <View className="mt-6">
        <Button label="Create Account" onPress={onSubmit} loading={busy} />
      </View>
      <OrDivider />
      <Button
        variant="secondary"
        label="Continue with Google"
        icon={<GoogleMark />}
        loading={googleBusy}
        onPress={onGoogle}
      />
    </Screen>
  );
}
