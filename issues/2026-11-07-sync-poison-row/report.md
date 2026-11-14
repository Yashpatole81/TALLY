# Issue: One invalid row blocks every sync push

## Summary
Push upserts dirty rows in chunks of 100. If the server rejects a single row (CHECK / FK violation),
the whole chunk fails and is retried forever, so nothing after it ever syncs.

## Impact
- Severity: medium (found in review cycle 1 of spec `2026-11-07-tally-mvp`).
- Offline edits stay on one device, and logout warns about unsynced changes indefinitely.

## Reproduction
1. Create a local row the server will reject (e.g. a future schema mismatch or a constraint the
   client doesn't mirror).
2. Run sync: the `upsert` returns a Postgres `23xxx` error and `push()` throws before marking any row clean.

## Investigation
- `src/data/sync.ts` `push()` threw on any chunk error, so it couldn't tell "offline" apart from "bad row".
- PostgREST surfaces Postgres SQLSTATE in `error.code`. Classes `22` (data) and `23` (constraint)
  are row-specific. Everything else (network, auth, 5xx) affects the whole run.
