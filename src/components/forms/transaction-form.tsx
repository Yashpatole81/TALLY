import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recordTransaction, removeTransaction } from '@/data/actions';
import type { Transaction } from '@/data/types';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '@/domain/categories';
import { type ISODate, monthKeyOf, monthName, relativeDayLabel } from '@/domain/dates';
import { CURRENCIES, type CurrencyCode, minorToInput, parseAmountInput, sanitizeAmountInput } from '@/domain/money';
import { showAlert } from '@/lib/alert';
import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { colors, fonts } from '@/theme/tokens';
import { makeTransactionSchema, type TransactionValues } from '@/validation/schemas';

import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { FieldMessage } from '../ui/field-message';
import { Chip } from '../ui/misc';
import { SelectRow } from '../ui/select-row';
import { Text } from '../ui/text';
import { useBusy } from './use-busy';

interface TransactionFormProps {
  userId: string;
  currency: CurrencyCode;
  type: 'expense' | 'income';
  existing: Transaction | null;
  today: ISODate;
}

type Picker = 'date' | 'category' | null;

/** Figma "Add Expense" / "Add Income" sheet. Also edits and deletes existing entries. */
export function TransactionForm({ userId, currency, type, existing, today }: TransactionFormProps) {
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState<Picker>(null);
  const [formError, setFormError] = useState<string>();
  const [busy, run] = useBusy();
  const isExpense = type === 'expense';
  const options = isExpense ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const optionField = isExpense ? 'category' : 'source';

  const { control, handleSubmit } = useForm<TransactionValues>({
    resolver: zodResolver(makeTransactionSchema(today)),
    defaultValues: {
      amount: existing ? minorToInput(existing.amountMinor) : '',
      date: existing?.occurredOn ?? today,
      category: existing?.category ?? null,
      source: existing?.source ?? null,
      note: existing?.note ?? '',
    },
    reValidateMode: 'onChange',
  });
  const [date, category, source] = useWatch({ control, name: ['date', 'category', 'source'] });
  const selectedId = isExpense ? category : source;
  const selectedLabel = options.find((option) => option.id === selectedId)?.label ?? 'Not selected';
  const budgetMonth = existing?.kind === 'salary' ? existing.budgetMonth : monthKeyOf(date);
  const noun = isExpense ? 'Expense' : 'Income';

  const save = handleSubmit(
    (values) =>
      run(async () => {
        setFormError(undefined);
        try {
          await recordTransaction(userId, {
            id: existing?.id,
            type,
            amountMinor: parseAmountInput(values.amount) ?? 0,
            occurredOn: values.date,
            category: values.category,
            source: values.source,
            note: values.note,
          });
          haptics.success();
          router.back();
        } catch (error) {
          haptics.error();
          setFormError(friendlyError(error));
        }
      }),
    () => haptics.error()
  );

  const confirmDelete = () =>
    showAlert(`Delete this ${noun.toLowerCase()}?`, 'It will be removed from your budget on all your devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void run(async () => {
            await removeTransaction(userId, existing!.id);
            haptics.heavy();
            router.back();
          }),
      },
    ]);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-6 pt-6"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center justify-between">
        <Text variant="greeting" accessibilityRole="header">
          {existing ? `Edit ${noun}` : `Add ${noun}`}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
          <X size={18} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      </View>

      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <View className="mt-6">
            <View className="flex-row items-center border-b border-line pb-4">
              <Text variant="sheetAmount" tone="muted" className="mr-4">
                {CURRENCIES[currency].symbol.trim()}
              </Text>
              <TextInput
                value={field.value}
                onChangeText={(text) => field.onChange(sanitizeAmountInput(text))}
                autoFocus={!existing}
                keyboardType="decimal-pad"
                inputMode="decimal"
                placeholder="0.00"
                placeholderTextColor={colors.ink}
                selectionColor={colors.ink}
                accessibilityLabel={`Amount in ${CURRENCIES[currency].name}`}
                style={{
                  flex: 1,
                  fontFamily: fonts.semibold,
                  fontSize: 48,
                  letterSpacing: -1.4,
                  color: colors.ink,
                  paddingVertical: 0,
                }}
              />
            </View>
            <FieldMessage message={fieldState.error?.message} />
          </View>
        )}
      />

      <View className="mt-6 gap-3">
        <SelectRow
          label="Date"
          value={relativeDayLabel(date, today)}
          expanded={picker === 'date'}
          onPress={() => setPicker(picker === 'date' ? null : 'date')}
        />
        {picker === 'date' ? (
          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <View>
                <Calendar
                  value={field.value}
                  maxDate={today}
                  onChange={(next) => {
                    field.onChange(next);
                    setPicker(null);
                  }}
                />
                <FieldMessage message={fieldState.error?.message} />
              </View>
            )}
          />
        ) : null}

        <SelectRow
          label={isExpense ? 'Category (optional)' : 'Source (optional)'}
          value={selectedLabel}
          expanded={picker === 'category'}
          onPress={() => setPicker(picker === 'category' ? null : 'category')}
        />
        {picker === 'category' ? (
          <Controller
            control={control}
            name={optionField}
            render={({ field }) => (
              <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
                {options.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={field.value === option.id}
                    onPress={() => {
                      field.onChange(field.value === option.id ? null : option.id);
                      setPicker(null);
                    }}
                  />
                ))}
              </View>
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="note"
          render={({ field, fieldState }) => (
            <View>
              <View className="h-[52px] justify-center rounded-control border border-line bg-surface px-4">
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={isExpense ? 'Note (optional), e.g. Grocery Shopping' : 'Note (optional)'}
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.ink}
                  maxLength={60}
                  accessibilityLabel="Note"
                  style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 }}
                />
              </View>
              <FieldMessage message={fieldState.error?.message} />
            </View>
          )}
        />
      </View>

      <FieldMessage message={formError} />
      <View className="mt-8">
        <Button label={existing ? 'Save Changes' : `Save ${noun}`} onPress={save} loading={busy} />
      </View>
      <Text variant="message" tone="muted" className="mt-4 text-center">
        {isExpense
          ? `Counts toward your ${monthName(budgetMonth)} spending.`
          : `Added to your ${monthName(budgetMonth)} budget.`}
      </Text>
      {existing ? (
        <Button variant="link" label={`Delete ${noun.toLowerCase()}`} onPress={confirmDelete} className="mt-2" />
      ) : null}
    </ScrollView>
  );
}
