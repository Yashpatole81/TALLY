import { Alert, type AlertButton, Platform } from 'react-native';

type BrowserDialogs = Pick<typeof globalThis, 'alert' | 'confirm'>;

/**
 * `Alert.alert` that also works on web, where react-native-web's Alert does nothing.
 * Same arguments as `Alert.alert`. Use this instead of `Alert` everywhere.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS === 'web') browserAlert(title, message, buttons);
  else Alert.alert(title, message, buttons);
}

/**
 * Web version using the browser's dialogs. With a button to confirm, `confirm()` asks: OK runs the
 * first non-cancel button, Cancel runs the cancel button. Otherwise `alert()` just shows the message.
 * Browser dialogs can't relabel their buttons, so titles should be questions ("Log out of Tally?").
 */
export function browserAlert(
  title: string,
  message?: string,
  buttons: AlertButton[] = [],
  dialogs: BrowserDialogs = globalThis
): void {
  const text = message ? `${title}\n\n${message}` : title;
  const cancel = buttons.find((button) => button.style === 'cancel');
  const action = buttons.find((button) => button.style !== 'cancel');
  if (!action) {
    dialogs.alert(text);
    cancel?.onPress?.();
    return;
  }
  if (dialogs.confirm(text)) action.onPress?.();
  else cancel?.onPress?.();
}
