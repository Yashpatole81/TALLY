import { browserAlert } from './alert';

const dialogs = (confirmed: boolean) => ({ alert: jest.fn(), confirm: jest.fn(() => confirmed) });

describe('browserAlert (web fallback for Alert.alert)', () => {
  it('runs the destructive action when the user presses OK', () => {
    const browser = dialogs(true);
    const logOut = jest.fn();
    const stay = jest.fn();

    browserAlert(
      'Log out of Tally?',
      'Your budget stays in your account.',
      [
        { text: 'Cancel', style: 'cancel', onPress: stay },
        { text: 'Log out', style: 'destructive', onPress: logOut },
      ],
      browser
    );

    expect(browser.confirm).toHaveBeenCalledWith('Log out of Tally?\n\nYour budget stays in your account.');
    expect(logOut).toHaveBeenCalledTimes(1);
    expect(stay).not.toHaveBeenCalled();
  });

  it('runs the cancel button when the user presses Cancel', () => {
    const browser = dialogs(false);
    const remove = jest.fn();
    const stay = jest.fn();

    browserAlert('Remove this goal?', undefined, [
      { text: 'Stay', style: 'cancel', onPress: stay },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ], browser);

    expect(browser.confirm).toHaveBeenCalledWith('Remove this goal?');
    expect(remove).not.toHaveBeenCalled();
    expect(stay).toHaveBeenCalledTimes(1);
  });

  it('shows a plain alert when there is nothing to confirm', () => {
    const browser = dialogs(true);

    browserAlert('Couldn’t remove the goal', 'Check your connection.', undefined, browser);

    expect(browser.alert).toHaveBeenCalledWith('Couldn’t remove the goal\n\nCheck your connection.');
    expect(browser.confirm).not.toHaveBeenCalled();
  });
});
