import { isCurrentUser } from '@/stores/session-store';

import { invalidateUser } from './query-client';
import { syncNow } from './sync';

/**
 * Debounced background sync: a burst of writes produces one push. Runs never overlap. A request
 * that arrives mid-run queues one follow-up. Failures (usually offline) wait for the next trigger.
 */
let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let queued: string | null = null;

export function requestSync(userId: string, delayMs = 1200): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void run(userId);
  }, delayMs);
}

export async function runSync(userId: string): Promise<void> {
  await run(userId);
}

async function run(userId: string): Promise<void> {
  if (!isCurrentUser(userId)) return; // signed out (or switched account) since this was scheduled
  if (running) {
    queued = userId;
    return;
  }
  running = true;
  try {
    const { pulled } = await syncNow(userId);
    if (pulled > 0) await invalidateUser(userId);
  } catch {
    // Offline or server unavailable: local data is intact and dirty rows stay queued.
  } finally {
    running = false;
    if (queued) {
      const next = queued;
      queued = null;
      requestSync(next);
    }
  }
}

export function cancelScheduledSync(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  queued = null;
}
