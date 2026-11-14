# Issue: Sign-out while offline leaves the session on the device

## Summary
`signOut()` wiped local data, but if the network call to Supabase failed, the stored session stayed.

## Impact
- Severity: high (found in review cycle 1 of spec `2026-11-07-tally-mvp`, before release).
- The user stays "signed in" on an empty database, so Home renders blank. Tokens also remain on the
  device after the user believes they've logged out.

## Reproduction
1. Sign in, go offline (airplane mode).
2. Settings → Logout → confirm.
3. `supabase.auth.signOut()` (scope `global`) fails on the network, so no `SIGNED_OUT` event fires.

## Investigation
- `src/data/actions.ts` swallowed the error from `signOutRemote()` and went on to `clearLocalData()`.
- supabase-js only clears local storage once the global sign-out request succeeds.
