# Resolution: Sign-out while offline leaves the session on the device

## Root Cause
`supabase.auth.signOut()` defaults to `scope: 'global'`, which needs the server. When that request
fails, supabase-js keeps the stored session. The error was swallowed, so the app cleared local data
but stayed signed in.

## Fix Applied
- `src/lib/auth.ts` `signOutRemote()`: if the global sign-out errors, call
  `signOut({ scope: 'local' })`, which always removes the stored session and fires `SIGNED_OUT`.
- `src/data/sync-scheduler.ts`: a scheduled sync is skipped once its user is no longer signed in.

## Prevention
- Spec security review now checks sign-out under offline conditions.
- Logout first flushes pending changes and warns before deleting unsynced ones (`settings.tsx`).
- To verify on a device: airplane mode → Logout → app must land on Welcome.

## Status
RESOLVED
