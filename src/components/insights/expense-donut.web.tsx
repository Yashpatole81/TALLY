import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import canvasKitWasm from 'canvaskit-wasm/bin/full/canvaskit.wasm';
import { View } from 'react-native';

import type { ExpenseDonutProps } from './expense-donut-chart';

/** Metro bundles the .wasm as an asset (metro.config.js), so on web the import is its URL. */
const CANVASKIT_OPTIONS = { locateFile: () => canvasKitWasm };

/**
 * Web build. Skia draws with CanvasKit (WebAssembly), which has to finish loading before any Skia
 * or victory-native code runs. So the chart module is only imported after WithSkiaWeb loads it.
 */
export function ExpenseDonut(props: ExpenseDonutProps) {
  return (
    <WithSkiaWeb<ExpenseDonutProps>
      opts={CANVASKIT_OPTIONS}
      getComponent={() => import('./expense-donut-chart').then((chart) => ({ default: chart.ExpenseDonut }))}
      componentProps={props}
      fallback={<View style={{ minHeight: 116 }} accessibilityLabel="Loading chart" />}
    />
  );
}
