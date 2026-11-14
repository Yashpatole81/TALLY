import { View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';

import { expenseCategory } from '@/domain/categories';
import { type CategoryShare, formatPercent } from '@/domain/insights';
import { type CurrencyCode, formatMoney } from '@/domain/money';
import { chartRamp, colors } from '@/theme/tokens';

import { Text } from '../ui/text';

const SIZE = 116;

export interface ExpenseDonutProps {
  shares: CategoryShare[];
  totalMinor: number;
  currency: CurrencyCode;
}

/**
 * Monochrome donut with white gaps between slices, total in the middle (Figma Insights).
 * Import `./expense-donut` instead: on web, Skia has to load before this module runs.
 */
export function ExpenseDonut({ shares, totalMinor, currency }: ExpenseDonutProps) {
  const data = shares.map((share, index) => ({
    label: expenseCategory(share.categoryId).label,
    value: share.amountMinor,
    color: chartRamp[Math.min(index, chartRamp.length - 1)]!,
  }));
  const description = shares
    .map((share) => `${expenseCategory(share.categoryId).label} ${formatPercent(share.percent)}`)
    .join(', ');

  return (
    <View className="flex-row items-center" accessible accessibilityLabel={`Expense breakdown: ${description}`}>
      <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
        <PolarChart
          data={data}
          labelKey="label"
          valueKey="value"
          colorKey="color"
          containerStyle={{ width: SIZE, height: SIZE }}>
          <Pie.Chart innerRadius="80%">
            {/* A children function replaces the default slice, so draw it explicitly, then the gap. */}
            {() => (
              <>
                <Pie.Slice />
                <Pie.SliceAngularInset angularInset={{ angularStrokeWidth: 3, angularStrokeColor: colors.surface }} />
              </>
            )}
          </Pie.Chart>
        </PolarChart>
        <View style={{ position: 'absolute' }} pointerEvents="none">
          <Text variant="section">{formatMoney(totalMinor, currency)}</Text>
        </View>
      </View>
      <View className="ml-6 flex-1 gap-3.5">
        {shares.map((share, index) => (
          <View key={share.categoryId} className="flex-row items-center">
            <View
              className="mr-3 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartRamp[Math.min(index, chartRamp.length - 1)] }}
            />
            <Text variant="subtitle" className="flex-1" numberOfLines={1}>
              {expenseCategory(share.categoryId).label}
            </Text>
            <Text variant="subtitle" tone="ink">
              {formatPercent(share.percent)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
