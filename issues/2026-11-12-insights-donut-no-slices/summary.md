# Resolution: Insights donut draws no slices

## Root Cause
victory-native's `Pie.Chart` renders a children function *instead of* its default `<Pie.Slice />`. The
chart's children function only returned `<Pie.SliceAngularInset />`, so only the white gaps were drawn.

## Fix Applied
- `src/components/insights/expense-donut-chart.tsx` (moved from `expense-donut.tsx` for the web build):
  the children function renders `<Pie.Slice />`, then the inset.
- Verified in headless Chrome (Skia web): the ring now shows both slices with white gaps.

## Prevention
- `src/components/insights/expense-donut-chart.test.tsx` mocks victory-native with the same
  children-replace-slice contract and fails if no slice is rendered (checked: it fails on the old code).
- `docs/tech.md` notes the victory-native behaviour.

## Status
RESOLVED
