import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
    addMonths,
    calendarWeeks,
    formatLongDate,
    formatMonthYear,
    type ISODate,
    type MonthKey,
    monthKeyOf,
    parseISODate,
    todayISO,
} from '@/domain/dates';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

import { Text } from './text';

interface CalendarProps {
  value: ISODate | null;
  onChange: (date: ISODate) => void;
  /** Days after this are disabled (e.g. no future-dated expenses). */
  maxDate?: ISODate;
  initialMonth?: MonthKey;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Month grid, Monday-first, black pill for the selected day (Figma "Custom Date"). */
export function Calendar({ value, onChange, maxDate, initialMonth }: CalendarProps) {
  const [month, setMonth] = useState<MonthKey>(() => initialMonth ?? monthKeyOf(value ?? maxDate ?? todayISO()));
  const canGoForward = !maxDate || addMonths(month, 1) <= monthKeyOf(maxDate);
  const header = value && monthKeyOf(value) === month ? formatLongDate(value) : formatMonthYear(month);

  return (
    <View className="rounded-card border border-line bg-surface px-3 pb-2 pt-3">
      <View className="mb-1 flex-row items-center px-2">
        <Text variant="bodyMedium" className="flex-1" accessibilityRole="header">
          {header}
        </Text>
        <Pressable
          onPress={() => setMonth(addMonths(month, -1))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-9 w-9 items-center justify-center">
          <ChevronLeft size={20} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          onPress={() => canGoForward && setMonth(addMonths(month, 1))}
          disabled={!canGoForward}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canGoForward }}
          className={`h-9 w-9 items-center justify-center ${canGoForward ? '' : 'opacity-30'}`}>
          <ChevronRight size={20} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      </View>
      <View className="flex-row">
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} variant="caption" className="h-8 flex-1 text-center">
            {day}
          </Text>
        ))}
      </View>
      {calendarWeeks(month).map((week) => (
        <View key={week[0]} className="flex-row">
          {week.map((date) => {
            const inMonth = monthKeyOf(date) === month;
            const selected = date === value;
            const disabled = Boolean(maxDate && date > maxDate);
            const day = parseISODate(date).day;
            return (
              <Pressable
                key={date}
                disabled={disabled}
                onPress={() => {
                  haptics.selection();
                  onChange(date);
                  if (!inMonth) setMonth(monthKeyOf(date));
                }}
                accessibilityRole="button"
                accessibilityLabel={formatLongDate(date)}
                accessibilityState={{ selected, disabled }}
                className="h-10 flex-1 items-center justify-center">
                <View
                  className={`h-[30px] min-w-[44px] items-center justify-center rounded-full ${selected ? 'bg-ink' : ''}`}>
                  <Text
                    variant={selected ? 'rowTitle' : 'subtitle'}
                    tone={selected ? 'inverse' : inMonth && !disabled ? 'ink' : 'muted'}
                    className={disabled ? 'opacity-40' : ''}>
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
