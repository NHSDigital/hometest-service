import TimeoutDialog from './timeout-dialog';
import {
  authSessionExpiryDurationMinutes,
  timeBeforePromptInMinutes
} from '../../../settings';

export function SessionTimer() {
  const timeoutDialogParams = {
    sessionDurationMinutes: Number(authSessionExpiryDurationMinutes ?? '10'),
    timeBeforePromptMinutes: Number(timeBeforePromptInMinutes ?? '1'),
    title: 'You’re about to be logged out',
    message: 'For security reasons, we’ll log you out of the NHS App in',
    keepAliveButtonText: 'Stay logged in',
    signOutButtonText: 'Log out'
  };

  return (
    <TimeoutDialog timeoutDialogParams={timeoutDialogParams}></TimeoutDialog>
  );
}
