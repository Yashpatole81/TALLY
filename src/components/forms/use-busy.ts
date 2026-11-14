import { useRef, useState } from 'react';

/**
 * Tracks an async action's in-flight state with plain React state (more predictable under the
 * React Compiler than reading react-hook-form's proxied formState during render). A ref guards
 * against a fast double tap starting the action twice before the re-render lands.
 */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return [busy, run] as const;
}
