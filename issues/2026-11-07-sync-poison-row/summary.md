# Resolution: One invalid row blocks every sync push

## Root Cause
`push()` upserted chunks of 100 rows and threw on any error, so a single row-level rejection
(Postgres SQLSTATE class 22/23) failed the chunk on every run.

## Fix Applied
- `src/data/sync-errors.ts`: `isRowSpecificError()` classifies SQLSTATE 22xxx/23xxx as row-level.
- `src/data/sync.ts`: on a row-level chunk error, retry each row on its own. Rows the server accepts
  are marked clean. Rejected rows stay dirty (kept locally). Network/auth errors still stop the run.

## Prevention
- `src/data/sync-errors.test.ts` covers the error classification.
- Client validation (zod) and the row mappers mirror the server CHECK constraints, so rejections
  should be rare.

## Status
RESOLVED
