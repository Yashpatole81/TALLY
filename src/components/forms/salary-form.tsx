import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import type { SalarySettings } from '@/data/actions';
import { type ISODate, monthKeyOf, parseISODate } from '@/domain/dates';
import { CURRENCIES, CURRENCY_CODES, minorToInput, parseAmountInput } from '@/domain/money';
import { allocationMessage, fundingMonth, salaryDateInMonth } from '@/domain/salary';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { salarySetupSchema, type SalarySetupValues } from '@/validation/schemas';

import { AmountField } from '../ui/amount-field';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { FieldMessage } from '../ui/field-message';
import { InfoChip } from '../ui/info-chip';
import { Chip } from '../ui/misc';
import { RadioCard } from '../ui/radio-card';
import { Screen, ScreenTitle } from '../ui/screen';
import { SelectRow } from '../ui/select-row';
import { Text } from '../ui/text';
import { useBusy } from './use-busy';

interface SalaryFormProps {
  initial: SalarySettings;
  today: ISODate;
  header: React.ReactNode;
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (settings: SalarySettings) => Promise<void>;
}

/** Figma "Set up your salary." Used in onboarding and from Settings. */
export function SalaryForm({ initial, today, header, title, subtitle, submitLabel, onSubmit }: SalaryFormProps) {
  const currentMonth = monthKeyOf(today);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [busy, run] = useBusy();
  const { control, handleSubmit } = useForm<SalarySetupValues>({
    resolver: zodResolver(salarySetupSchema),
    defaultValues: {
      salary: initial.monthlySalaryMinor > 0 ? minorToInput(initial.monthlySalaryMinor) : '',
      rule: initial.salaryRule.kind,
      customDay: initial.salaryRule.kind === 'custom_date' ? initial.salaryRule.day : null,
      allocation: initial.allocation,
      currency: initial.currency,
    },
    reValidateMode: 'onChange',
  });
  const [rule, customDay, allocation, currency] = useWatch({
    control,
    name: ['rule', 'customDay', 'allocation', 'currency'],
  });
  const calendarMonth = fundingMonth(currentMonth, allocation);

  const submit = handleSubmit(
    (values) =>
      run(async () => {
        setFormError(undefined);
        try {
          await onSubmit({
            monthlySalaryMinor: parseAmountInput(values.salary) ?? 0,
            salaryRule:
              values.rule === 'custom_date' && values.customDay
                ? { kind: 'custom_date', day: values.customDay }
                : { kind: 'last_working_day' },
            allocation: values.allocation,
            currency: values.currency,
          });
        } catch (error) {
          haptics.error();
          setFormError(friendlyError(error));
        }
      }),
    () => haptics.error()
  );

  return (
    <Screen footer={<Button label={submitLabel} onPress={submit} loading={busy} />}>
      {header}
      <ScreenTitle title={title} subtitle={subtitle} className="mt-4" />
      <View className="mt-7 gap-6">
        <Controller
          control={control}
          name="salary"
          render={({ field, fieldState }) => (
            <AmountField
              label="Monthly Salary"
              value={field.value}
              onChangeText={field.onChange}
              currency={currency}
              error={fieldState.error?.message}
            />
          )}
        />

        <View>
          <Text variant="label" className="mb-2">
            Salary Credit Date
          </Text>
          <Controller
            control={control}
            name="rule"
            render={({ field }) => (
              <View className="flex-row gap-3" accessibilityRole="radiogroup">
                <RadioCard
                  className="flex-1"
                  label="Last Working Day"
                  selected={field.value === 'last_working_day'}
                  onSelect={() => field.onChange('last_working_day')}
                />
                <RadioCard
                  className="flex-1"
                  label="Custom Date"
                  selected={field.value === 'custom_date'}
                  onSelect={() => field.onChange('custom_date')}
                />
              </View>
            )}
          />
          {rule === 'custom_date' ? (
            <Controller
              control={control}
              name="customDay"
              render={({ field, fieldState }) => (
                <View className="mt-3">
                  <Calendar
                    key={calendarMonth}
                    initialMonth={calendarMonth}
                    value={customDay ? salaryDateInMonth({ kind: 'custom_date', day: customDay }, calendarMonth) : null}
                    onChange={(date) => field.onChange(parseISODate(date).day)}
                  />
                  <FieldMessage message={fieldState.error?.message} />
                </View>
              )}
            />
          ) : null}
        </View>

        <View>
          <Text variant="label" className="mb-2">
            Budget Allocation
          </Text>
          <Controller
            control={control}
            name="allocation"
            render={({ field }) => (
              <View className="gap-3" accessibilityRole="radiogroup">
                <RadioCard
                  label="Following Month"
                  tag="Recommended"
                  selected={field.value === 'following_month'}
                  onSelect={() => field.onChange('following_month')}
                />
                <RadioCard
                  label="Same Month"
                  selected={field.value === 'same_month'}
                  onSelect={() => field.onChange('same_month')}
                />
              </View>
            )}
          />
          <View className="mt-3">
            <InfoChip>{allocationMessage(currentMonth, allocation)}</InfoChip>
          </View>
        </View>

        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <View>
              <SelectRow
                label="Currency"
                value={`${field.value} (${CURRENCIES[field.value].symbol.trim()})`}
                expanded={currencyOpen}
                onPress={() => setCurrencyOpen((open) => !open)}
              />
              {currencyOpen ? (
                <View className="mt-3 flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
                  {CURRENCY_CODES.map((code) => (
                    <Chip
                      key={code}
                      label={`${code} (${CURRENCIES[code].symbol.trim()})`}
                      selected={code === field.value}
                      onPress={() => {
                        field.onChange(code);
                        setCurrencyOpen(false);
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
        <FieldMessage message={formError} />
      </View>
    </Screen>
  );
}
