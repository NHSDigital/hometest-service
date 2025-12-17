import { useCallback, useEffect } from 'react';
import type { Dialog, TimeoutDialogParams } from '../../models/session-timer';
import dialog from './dialog';
import { RoutePath } from '../../models/route-paths';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateDialogHTML } from './htmlGenerator';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { useAuditEvent } from '../../../hooks/eventAuditHook';

interface TimeoutDialogProps {
  timeoutDialogParams: TimeoutDialogParams;
}

const TimeoutDialog: React.FC<TimeoutDialogProps> = ({
  timeoutDialogParams
}) => {
  const navigator = useNavigate();
  const location = useLocation();
  const { triggerAuditEvent } = useAuditEvent();
  const getDateNow = () => Date.now();

  const isUserComingFromNHSApp = window.nhsapp.tools.isOpenInNHSApp();

  const roundSecondsUp = (counter: number): number => {
    if (counter > 60) {
      return counter;
    }
    if (counter < 30) {
      return 30;
    }
    return Math.ceil(counter / 30) * 30;
  };

  const roundSecondsUpToNearestFive = (counter: number) =>
    Math.ceil(counter / 5) * 5;

  const updateTextIfChanged = ($elem: HTMLElement, text: string) => {
    if ($elem.innerText !== text) {
      $elem.innerText = text;
    }
  };

  const setupDialog = useCallback(
    (
      signoutTime: number,
      keepAliveAndClose: () => void,
      cleanupFunctions: (() => void)[],
      currentTimerRef: { currentTimer: number }
    ) => {
      const {
        $element,
        $staySignedInButton,
        $signOutAnchor,
        $countdownElement,
        $audibleMessage
      } = generateDialogHTML(timeoutDialogParams);

      const signOut = () => {
        isUserComingFromNHSApp
          ? window.nhsapp.navigation.goToPage(
              window.nhsapp.navigation.AppPage.HOME_PAGE
            )
          : navigator(RoutePath.SessionTimedOutPage);
      };

      const getHumanText = (counter: number) => {
        let minutes: number;
        let visibleMessage: string;
        let unitsText: string;
        if (counter > 20) {
          counter = roundSecondsUpToNearestFive(counter);
        }
        if (counter < 60) {
          unitsText = counter === 1 ? 'second' : 'seconds';
          visibleMessage = `${counter} ${unitsText}`;
        } else {
          minutes = Math.ceil(counter / 60);
          unitsText = minutes === 1 ? 'minute' : 'minutes';
          visibleMessage = `${minutes} ${unitsText}`;
        }
        return visibleMessage;
      };

      const getAudibleHumanText = (counter: number) => {
        const humanText = getHumanText(roundSecondsUp(counter));
        const messageParts = [timeoutDialogParams.message, ' ', humanText, '.'];
        if (timeoutDialogParams.messageSuffix) {
          messageParts.push(' ');
          messageParts.push(timeoutDialogParams.messageSuffix);
        }
        return messageParts.join('');
      };

      $signOutAnchor.addEventListener('click', signOut);
      if (isUserComingFromNHSApp) {
        $signOutAnchor.setAttribute('href', '#');
      } else {
        $signOutAnchor.setAttribute('href', RoutePath.LogoutPage);
      }
      $element?.appendChild(document.createTextNode(' '));

      let dialogControl: Dialog;
      if ($element instanceof HTMLElement) {
        dialogControl = dialog.displayDialog($element);
      } else {
        throw new Error(
          'The element is null and cannot be passed to displayDialog.'
        );
      }

      cleanupFunctions.push(() => {
        dialogControl.closeDialog();
      });

      $staySignedInButton.addEventListener('click', keepAliveAndClose);

      dialogControl.setAriaLabelledBy(
        'app-timeout-dialog__heading app-timeout-message'
      );

      const getMillisecondsRemaining = () => signoutTime - getDateNow();
      const getSecondsRemaining = () =>
        Math.round(getMillisecondsRemaining() / 1000);

      const updateCountdown = (counter: number) => {
        const visibleMessage = getHumanText(counter);
        const audibleHumanText = getAudibleHumanText(counter);

        if ($countdownElement && $audibleMessage) {
          updateTextIfChanged($countdownElement, visibleMessage);
          updateTextIfChanged($audibleMessage, audibleHumanText);
        }
      };

      const getNextTimeout = () => {
        const remaining = getMillisecondsRemaining();
        const roundedRemaining =
          Math.floor(getMillisecondsRemaining() / 1000) * 1000;
        if (roundedRemaining <= 60000) {
          return remaining - roundedRemaining || 1000;
        }
        return (
          remaining - (roundedRemaining - (roundedRemaining % 60000 || 60000))
        );
      };

      const runUpdate = () => {
        const counter = Math.max(getSecondsRemaining(), 0);
        updateCountdown(counter);
        if (counter === 0) {
          signOut();
        } else {
          currentTimerRef.currentTimer = window.setTimeout(
            runUpdate,
            getNextTimeout()
          );
        }
      };

      runUpdate();
    },
    [isUserComingFromNHSApp, navigator, timeoutDialogParams]
  );

  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];
    const currentTimerRef = { currentTimer: 0 };

    const keepAliveAndClose = () => {
      cleanup();
      void triggerAuditEvent({
        eventType: AuditEventType.SessionTimeExtended
      });
      setupDialogTimer();
    };

    const cleanup = () => {
      while (cleanupFunctions.length > 0) {
        const fn = cleanupFunctions.shift();
        if (fn) fn();
      }
    };

    const listenForSessionActivityAndResetDialogTimer = () => {
      const handleLocationChange = () => {
        const timeOfActivity = getDateNow();
        cleanup();
        setupDialogTimer(timeOfActivity);
      };

      handleLocationChange();
    };

    const setupDialogTimer = (timeOfLastActivity = getDateNow()) => {
      const sessionDurationInMilliseconds =
        timeoutDialogParams.sessionDurationMinutes * 60 * 1000;
      const timeBeforePromptInMilliseconds =
        timeoutDialogParams.timeBeforePromptMinutes * 60 * 1000;
      const signoutTime = timeOfLastActivity + sessionDurationInMilliseconds;
      const timeUntilLogoutPrompt =
        sessionDurationInMilliseconds - timeBeforePromptInMilliseconds;
      const timeout = window.setTimeout(() => {
        setupDialog(
          signoutTime,
          keepAliveAndClose,
          cleanupFunctions,
          currentTimerRef
        );
      }, timeUntilLogoutPrompt);

      cleanupFunctions.push(() => {
        window.clearTimeout(timeout);
        if (currentTimerRef.currentTimer) {
          window.clearTimeout(currentTimerRef.currentTimer);
        }
      });
    };

    listenForSessionActivityAndResetDialogTimer();

    return cleanup;
  }, [
    timeoutDialogParams,
    location,
    navigator,
    triggerAuditEvent,
    setupDialog
  ]);

  return null;
};

export default TimeoutDialog;
