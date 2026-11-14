# Issue: Insights donut draws no slices

## Summary
The Insights donut shows the total and the legend, but no ring. Found while testing the new web build
(spec `2026-11-07-tally-mvp`, Group 9).

## Impact
- Severity: medium. Every platform: the chart is the main visual on Insights.
- Not caught earlier: the app hasn't run on a device yet, and the chart has no tests.

## Reproduction
1. Render `ExpenseDonut` with two shares (headless Chrome against the dev server, Skia web build).
2. CanvasKit loads and a 116×116 canvas is created, but the screenshot shows only "₹2,000" and the legend.

## Investigation
- Ruled out Skia on web: CanvasKit is loaded (`globalThis.CanvasKit` is an object) and the canvas exists.
- `victory-native@42.0.1` `src/pie/PieChart.tsx`: `{children ? children({ slice }) : <PieSlice />}`.
  Passing a children function replaces the default slice.
- `src/components/insights/expense-donut.tsx` passed `{() => <Pie.SliceAngularInset … />}`, so only
  the white gaps between slices were drawn, on a white card.
