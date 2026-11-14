import { forwardRef } from 'react';
import { TextInput, View } from 'react-native';

import { CURRENCIES, type CurrencyCode, formatAmountInputDisplay, sanitizeAmountInput } from '@/domain/money';
import { colors, fonts } from '@/theme/tokens';

import { FieldMessage } from './field-message';
import { Text } from './text';
import type { TextInputRef } from './text-field';

interface AmountFieldProps {
  label: string;
  /** Sanitized raw value ("16000", "1200.5"). Displayed with grouping. */
  value: string;
  onChangeText: (raw: string) => void;
  currency: CurrencyCode;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Card-style money input used for salary and goal amounts ("₹16,000" in the Figma). */
export const AmountField = forwardRef<TextInputRef, AmountFieldProps>(function AmountField(
  { label, value, onChangeText, currency, error, hint, placeholder = '0', autoFocus },
  ref
) {
  const symbol = CURRENCIES[currency].symbol.trim();
  return (
    <View>
      <Text variant="label" className="mb-2">
        {label}
      </Text>
      <View
        className={`h-[60px] flex-row items-center rounded-control bg-surface px-4 ${
          error ? 'border border-ink' : 'border border-line'
        }`}>
        <Text variant="amountInput" tone={value ? 'ink' : 'muted'}>
          {symbol}
        </Text>
        <TextInput
          ref={ref}
          value={formatAmountInputDisplay(value, currency)}
          onChangeText={(text) => onChangeText(sanitizeAmountInput(text))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          autoFocus={autoFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          selectionColor={colors.ink}
          accessibilityLabel={`${label} in ${CURRENCIES[currency].name}`}
          style={{
            flex: 1,
            fontFamily: fonts.semibold,
            fontSize: 30,
            letterSpacing: -0.8,
            color: colors.ink,
            paddingVertical: 0,
          }}
        />
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </View>
      <FieldMessage message={error} />
    </View>
  );
});
