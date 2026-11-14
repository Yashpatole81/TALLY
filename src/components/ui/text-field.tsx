import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

import { FieldMessage } from './field-message';
import { Text } from './text';

/** Instance type for refs to a TextInput (RN 0.88 types). */
export type TextInputRef = React.ComponentRef<typeof TextInput>;

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Adds the eye toggle and hides the value. */
  secure?: boolean;
  /** Shows the value without letting it be edited (e.g. account email). */
  readOnly?: boolean;
}

/**
 * Labelled 52pt input with 14pt corners. The border goes ink on focus and on error, as in the
 * Figma validation frames.
 */
export const TextField = forwardRef<TextInputRef, TextFieldProps>(function TextField(
  { label, error, secure = false, readOnly = false, onFocus, onBlur, ...inputProps },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);
  const active = focused || Boolean(error);

  return (
    <View>
      <Text variant="label" className="mb-2">
        {label}
      </Text>
      <View
        className={`h-[52px] flex-row items-center rounded-control bg-surface px-4 ${
          active ? 'border border-ink' : 'border border-line'
        }`}>
        <TextInput
          ref={ref}
          {...inputProps}
          editable={!readOnly && inputProps.editable !== false}
          secureTextEntry={secure && hidden}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.muted}
          selectionColor={colors.ink}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize: 15,
            color: readOnly ? colors.muted : colors.ink,
            paddingVertical: 0,
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            className="-mr-3 ml-2 h-11 w-11 items-center justify-center">
            {hidden ? (
              <EyeOff size={20} color={colors.icon} strokeWidth={1.6} />
            ) : (
              <Eye size={20} color={colors.icon} strokeWidth={1.6} />
            )}
          </Pressable>
        ) : null}
      </View>
      <FieldMessage message={error} />
    </View>
  );
});
