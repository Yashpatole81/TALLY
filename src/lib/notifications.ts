import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, addMonths, type ISODate, monthKeyOf, monthName, parseISODate } from '@/domain/dates';
import { type BudgetAllocation, nextSalaryDate, type SalaryRule } from '@/domain/salary';

/** Local "payday" reminders. No push tokens and no server involvement. Web build: `notifications.web.ts`. */
const CHANNEL_ID = 'salary-reminders';
const REMINDER_HOUR = 9;

/** Whether this build can schedule reminders at all (false on web). */
export const remindersSupported: boolean = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Salary reminders',
    // eslint-disable-next-line import/namespace -- exported enum. TypeScript resolves it, eslint-plugin-import can't follow the re-export.
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Asks for permission if needed. @returns whether reminders can be shown. */
export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

const reminderTime = (date: ISODate) => {
  const { year, month, day } = parseISODate(date);
  return new Date(year, month - 1, day, REMINDER_HOUR, 0, 0);
};

/**
 * Replaces any scheduled reminder with one for the next payday at 09:00 local time,
 * e.g. 30 Nov → "Your December budget is ready." Does nothing without permission.
 */
export async function scheduleSalaryReminder(
  today: ISODate,
  rule: SalaryRule,
  allocation: BudgetAllocation
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await ensureChannel();

  let payday = nextSalaryDate(today, rule);
  // If today's 09:00 has already passed, remind on the following payday instead.
  if (reminderTime(payday).getTime() <= Date.now()) payday = nextSalaryDate(addDays(payday, 1), rule);

  const funded = allocation === 'following_month' ? addMonths(monthKeyOf(payday), 1) : monthKeyOf(payday);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Payday',
      body: `Your salary should land today. Your ${monthName(funded)} budget is ready.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime(payday),
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelSalaryReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
