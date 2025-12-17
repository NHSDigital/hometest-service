import { render, screen } from '@testing-library/react';
import { SessionTimer } from '../../../../lib/components/session-timer/session-timer';

jest.mock('../../../../lib/components/session-timer/timeout-dialog.tsx', () => {
  return {
    __esModule: true,
    default: (props: any) => (
      <div data-testid="mock-timeout-dialog">{JSON.stringify(props)}</div>
    )
  };
});

describe('When SessionTimer is rendered', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should render TimeoutDialog with timeoutDialogParams', () => {
    render(<SessionTimer />);

    const node = screen.getByTestId('mock-timeout-dialog');
    const props = JSON.parse(node.textContent || '{}');

    expect(props).toHaveProperty('timeoutDialogParams');
    expect(typeof props.timeoutDialogParams.sessionDurationMinutes).toBe(
      'number'
    );
    expect(typeof props.timeoutDialogParams.timeBeforePromptMinutes).toBe(
      'number'
    );
    expect(props.timeoutDialogParams).toMatchObject({
      title: expect.any(String),
      message: expect.any(String),
      keepAliveButtonText: expect.any(String),
      signOutButtonText: expect.any(String)
    });
  });
});
