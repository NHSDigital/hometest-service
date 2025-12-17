import { render } from '@testing-library/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuditEvent } from '../../../../hooks/eventAuditHook';
import TimeoutDialog from '../../../../lib/components/session-timer/timeout-dialog';
import { generateDialogHTML } from '../../../../lib/components/session-timer/htmlGenerator';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: jest.fn()
}));

jest.mock('../../../../lib/components/session-timer/dialog', () => ({
  displayDialog: jest.fn(() => ({
    closeDialog: jest.fn(),
    setAriaLabelledBy: jest.fn()
  }))
}));

jest.mock('../../../../lib/components/session-timer/htmlGenerator', () => ({
  generateDialogHTML: jest.fn(() => ({
    $element: document.createElement('div'),
    $staySignedInButton: document.createElement('button'),
    $signOutAnchor: document.createElement('a'),
    $countdownElement: document.createElement('span'),
    $audibleMessage: document.createElement('span')
  }))
}));

window.nhsapp = {
  tools: {
    isOpenInNHSApp: jest.fn()
  },
  navigation: {
    goToPage: jest.fn(),
    AppPage: {
      HOME_PAGE: 'home'
    }
  }
};

describe('TimeoutDialog', () => {
  const mockNavigate = useNavigate();
  const mockTriggerAuditEvent = jest.fn();

  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuditEvent as jest.Mock).mockReturnValue({
      triggerAuditEvent: mockTriggerAuditEvent
    });
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/current-path' });
    window.nhsapp.tools.isOpenInNHSApp.mockReturnValue(false);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  const timeoutDialogParams = {
    sessionDurationMinutes: 30,
    timeBeforePromptMinutes: 5,
    message: 'Your session will expire in',
    messageSuffix: 'Please save your work.'
  };

  it('should set up the timeout dialog after the specified time', () => {
    render(<TimeoutDialog timeoutDialogParams={timeoutDialogParams} />);
    expect(generateDialogHTML).not.toHaveBeenCalledWith(timeoutDialogParams);

    const timeUntilLogoutPrompt =
      (timeoutDialogParams.sessionDurationMinutes -
        timeoutDialogParams.timeBeforePromptMinutes) *
      60 *
      1000;
    jest.advanceTimersByTime(timeUntilLogoutPrompt);

    expect(generateDialogHTML).toHaveBeenCalledWith(timeoutDialogParams);
  });
});
