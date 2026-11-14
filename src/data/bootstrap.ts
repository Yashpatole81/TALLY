import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayISO } from '@/domain/dates';
import { scheduleSalaryReminder } from '@/lib/notifications';

import { runMonthlyUpkeep } from './actions';
import { DatabaseInUseError } from './db';
import { invalidateUser } from './query-client';
import { getProfile, newProfile, saveProfile } from './repositories';
import { syncNow } from './sync';
import { requestSync } from './sync-scheduler';

/**
 * - idle: signed out
 * - loading: preparing local data (splash stays up)
 * - ready: local profile available (possibly offline)
 * - offline-empty: no local copy and the server was unreachable. Onboarding again here could
 *   overwrite a real account, so the app shows a retry screen instead.
 * - in-use: web only. Another tab holds the local database (see `DatabaseInUseError`).
 */
export type BootState = 'idle' | 'loading' | 'ready' | 'offline-empty' | 'in-use';

type Outcome = Exclude<BootState, 'idle' | 'loading'>;

async function prepare(userId: string, fallbackName: string): Promise<Outcome> {
  let reachedServer = true;
  try {
    await syncNow(userId); // pull first, so returning users on a new device skip onboarding
  } catch {
    reachedServer = false;
  }
  let profile = await getProfile(userId);
  if (!profile) {
    if (!reachedServer) return 'offline-empty';
    profile = newProfile(userId, fallbackName);
    await saveProfile(profile);
    requestSync(userId);
  }
  const today = todayISO();
  await runMonthlyUpkeep(userId, today);
  if (profile.onboardedAt && profile.notificationsEnabled) {
    void scheduleSalaryReminder(today, profile.salaryRule, profile.allocation).catch(() => undefined);
  }
  await invalidateUser(userId);
  return 'ready';
}

export function useBootstrap(userId: string | undefined, fallbackName: string) {
  const [attempt, setAttempt] = useState(0);
  // The outcome is tagged with the run it belongs to, so a new user/attempt reads as 'loading'
  // without calling setState synchronously inside the effect.
  const runKey = userId ? `${userId}#${attempt}` : null;
  const [outcome, setOutcome] = useState<{ key: string; state: Outcome } | null>(null);

  useEffect(() => {
    if (!userId || !runKey) return;
    let cancelled = false;
    prepare(userId, fallbackName)
      .catch((error: unknown): Outcome => (error instanceof DatabaseInUseError ? 'in-use' : 'offline-empty'))
      .then((state) => {
        if (!cancelled) setOutcome({ key: runKey, state });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, runKey, fallbackName]);

  // Coming back to the app: sync, and record salary if a new budget month started meanwhile.
  useEffect(() => {
    if (!userId) return;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      requestSync(userId, 0);
      void runMonthlyUpkeep(userId, todayISO()).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [userId]);

  const state: BootState = !runKey ? 'idle' : outcome?.key === runKey ? outcome.state : 'loading';
  return { state, retry: () => setAttempt((value) => value + 1) };
}
