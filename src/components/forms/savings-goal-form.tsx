import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import type { GoalInput } from '@/data/actions';
import type { SavingsGoal } from '@/data/types';
import { addMonths, type ISODate, monthKeyOf } from '@/domain/dates';
import { type CurrencyCode, formatMoney, MINUS, minorToInput, parseAmountInput } from '@/domain/money';
import { autoMonthlyContribution } from '@/domain/savings';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { makeSavingsGoalSchema, type SavingsGoalValues } from '@/validation/schemas';

import { AmountField } from '../ui/amount-field';
import { Button } from '../ui/button';
import { FieldMessage } from '../ui/field-message';
import { InfoChip } from '../ui/info-chip';
import { MonthStepper } from '../ui/month-stepper';
import { RadioCard } from '../ui/radio-card';
import { Screen, ScreenTitle } from '../ui/screen';
import { Text } from '../ui/text';
import { TextField } from '../ui/text-field';
import { useBusy } from './use-busy';

interface SavingsGoalFormProps {
  initial: SavingsGoal | null;
  /** Already saved toward this goal (edit mode). Lowers the auto amount. */
  savedMinor?: number;
  salaryMinor: number;
  currency: CurrencyCode;
  today: ISODate;
  header: React.ReactNode;
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (input: GoalInput) => Promise<void>;
  /** "Skip for now" in onboarding, "Remove goal" in Settings. */
  secondaryAction?: { label: string; onPress: () => void };
}

/**
 * "What are you saving for?" Savings come off the top of the salary, so the spendable budget
 * shown afterwards already excludes them. Mock: REFERENCE/UI/savings-goal-onboarding.svg
 */
export function SavingsGoalForm({
  initial,
  savedMinor = 0,
  salaryMinor,
  currency,
  today,
  header,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  secondaryAction,
}: SavingsGoalFormProps) {
  const currentMonth = monthKeyOf(today);
  const [formError, setFormError] = useState<string>();
  const [busy, run] = useBusy();
  const { control, handleSubmit } = useForm<SavingsGoalValues>({
    resolver: zodResolver(makeSavingsGoalSchema(salaryMinor, currentMonth)),
    defaultValues: {
      name: initial?.name ?? '',
      target: initial?.targetMinor ? minorToInput(initial.targetMinor) : '',
      mode: initial?.mode ?? 'fixed',
      monthly: initial?.fixedMonthlyMinor ? minorToInput(initial.fixedMonthlyMinor) : '',
      targetMonth: initial?.targetMonth && initial.targetMonth >= currentMonth ? initial.targetMonth : addMonths(currentMonth, 11),
    },
    reValidateMode: 'onChange',
  });
  const [mode, target, monthly, targetMonth] = useWatch({ control, name: ['mode', 'target', 'monthly', 'targetMonth'] });

  const targetMinor = parseAmountInput(target);
  const contribution =
    mode === 'fixed'
      ? (parseAmountInput(monthly) ?? 0)
      : targetMinor && targetMonth
        ? autoMonthlyContribution(targetMinor, savedMinor, currentMonth, targetMonth)
        : 0;
  const fmt = (value: number) => formatMoney(value, currency);

  const submit = handleSubmit(
    (values) =>
      run(async () => {
        setFormError(undefined);
        try {
          await onSubmit({
            name: values.name.trim(),
            targetMinor: parseAmountInput(values.target) || null,
            targetMonth: values.mode === 'auto' ? values.targetMonth : null,
            mode: values.mode,
            fixedMonthlyMinor: values.mode === 'fixed' ? parseAmountInput(values.monthly) : null,
          });
        } catch (error) {
          haptics.error();
          setFormError(friendlyError(error));
        }
      }),
    () => haptics.error()
  );

  return (
    <Screen
      footer={
        <View className="gap-1">
          {secondaryAction ? (
            <Button variant="link" label={secondaryAction.label} onPress={secondaryAction.onPress} />
          ) : null}
          <Button label={submitLabel} onPress={submit} loading={busy} />
        </View>
      }>
      {header}
      <ScreenTitle title={title} subtitle={subtitle} className="mt-4" />
      <View className="mt-7 gap-6">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label="Goal Name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Emergency fund, a trip, a new phone"
              autoCapitalize="sentences"
              maxLength={60}
            />
          )}
        />
        <Controller
          control={control}
          name="target"
          render={({ field, fieldState }) => (
            <AmountField
              label="Target Amount"
              hint="Optional"
              value={field.value}
              onChangeText={field.onChange}
              currency={currency}
              error={fieldState.error?.message}
            />
          )}
        />
        <View>
          <Text variant="label" className="mb-2">
            Set Aside Each Month
          </Text>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <View className="flex-row gap-3" accessibilityRole="radiogroup">
                <RadioCard
                  className="flex-1"
                  label="Fixed Amount"
                  selected={field.value === 'fixed'}
                  onSelect={() => field.onChange('fixed')}
                />
                <RadioCard
                  className="flex-1"
                  label="Auto"
                  tag="By date"
                  selected={field.value === 'auto'}
                  onSelect={() => field.onChange('auto')}
                />
              </View>
            )}
          />
          <View className="mt-3">
            {mode === 'fixed' ? (
              <Controller
                control={control}
                name="monthly"
                render={({ field, fieldState }) => (
                  <AmountField
                    label="Monthly Amount"
                    value={field.value}
                    onChangeText={field.onChange}
                    currency={currency}
                    error={fieldState.error?.message}
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                name="targetMonth"
                render={({ field, fieldState }) => (
                  <View>
                    <MonthStepper
                      label="Reach it by"
                      value={field.value ?? addMonths(currentMonth, 11)}
                      onChange={field.onChange}
                      min={currentMonth}
                      max={addMonths(currentMonth, 120)}
                    />
                    <FieldMessage message={fieldState.error?.message} />
                    {contribution > 0 && !fieldState.error ? (
                      <Text variant="message" tone="muted" className="mt-2">
                        That’s {fmt(contribution)} a month.
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            )}
          </View>
        </View>
        <InfoChip title="Savings come off the top.">
          {`${fmt(salaryMinor)} salary ${MINUS} ${fmt(contribution)} saved = ${fmt(
            Math.max(0, salaryMinor - contribution)
          )} spendable each month.`}
        </InfoChip>
        <Text variant="caption">Tally sets this money aside in your budget. It doesn’t move money between bank accounts.</Text>
        <FieldMessage message={formError} />
      </View>
    </Screen>
  );
}
