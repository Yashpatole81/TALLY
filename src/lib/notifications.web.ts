import type * as native from './notifications';

/**
 * Web build. expo-notifications can't schedule local notifications in a browser
 * (`scheduleNotificationAsync` throws), so payday reminders only exist in the Android and iOS app.
 */
export const remindersSupported: typeof native.remindersSupported = false;

export const requestReminderPermission: typeof native.requestReminderPermission = async () => false;

export const scheduleSalaryReminder: typeof native.scheduleSalaryReminder = async () => undefined;

export const cancelSalaryReminders: typeof native.cancelSalaryReminders = async () => undefined;
