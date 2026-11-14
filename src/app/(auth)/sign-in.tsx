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
import { signInWithEmail, signInWithGoogle } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { signInSchema, type SignInValues } from '@/validation/schemas';

export default function SignIn() {
  const passwordRef = useRef<TextInputRef>(null);
  const [formError, setFormError] = useState<string>();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [busy, run] = useBusy();
  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(
    ({ email, password }) =>
      run(async () => {
      setFormError(undefined);
      try {
        await signInWithEmail(email, password); // the route guard takes over on success
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
      footer={<AuthFooter prompt="New here?" action="Create Account" onPress={() => router.replace('/sign-up')} />}>
      <BackHeader />
      <ScreenTitle title="Welcome aboard." subtitle="Sign in to start managing your monthly budget." />
      <View className="mt-8">
        <Button
          variant="secondary"
          label="Continue with Google"
          icon={<GoogleMark />}
          loading={googleBusy}
          onPress={onGoogle}
        />
      </View>
      <OrDivider />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="Email"
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
      <View className="mt-5">
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
              placeholder="Enter your password"
              secure
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void onSubmit()}
              maxLength={72}
            />
          )}
        />
      </View>
      <FieldMessage message={formError} />
      <View className="mt-6">
        <Button label="Sign In" onPress={onSubmit} loading={busy} />
      </View>
      <Button variant="link" label="Forgot Password" onPress={() => router.push('/forgot-password')} className="mt-3" />
    </Screen>
  );
}
