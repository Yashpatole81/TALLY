import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ExpenseDonut } from './expense-donut-chart';

// victory-native draws with Skia, which doesn't run in Jest. These stand-ins keep the contract that
// broke the chart: Pie.Chart renders its children function *instead of* the default slice.
jest.mock('victory-native', () => {
  const { createElement, Fragment } = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  const Slice = () => createElement(Text, null, 'slice');
  return {
    PolarChart: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
    Pie: {
      Chart: ({ children }: { children?: (args: { slice: object }) => ReactNode }) =>
        createElement(Fragment, null, children ? children({ slice: {} }) : createElement(Slice)),
      Slice,
      SliceAngularInset: () => createElement(Text, null, 'gap'),
    },
  };
});

describe('ExpenseDonut', () => {
  it('draws the slices, not just the gaps between them', async () => {
    await render(
      <ExpenseDonut
        shares={[{ categoryId: 'food', amountMinor: 120000, percent: 100 }]}
        totalMinor={120000}
        currency="INR"
      />
    );

    expect(screen.getByText('slice')).toBeTruthy();
    expect(screen.getByText('gap')).toBeTruthy();
    expect(screen.getByText('Food & groceries')).toBeTruthy();
  });
});
