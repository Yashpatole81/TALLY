import * as Haptics from 'expo-haptics';

/**
 * Haptics are an extra layer of feedback, never the only one (many users turn them off).
 * Each helper fires once per user action, in the same frame as the visual change.
 */
export const haptics = {
  /** A value ticked over: radio, chip, calendar day. */
  selection: () => void Haptics.selectionAsync().catch(() => undefined),
  /** A save or other operation succeeded. */
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  /** Submission failed validation or the request failed. */
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
  /** A destructive action fired. */
  heavy: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined),
};
