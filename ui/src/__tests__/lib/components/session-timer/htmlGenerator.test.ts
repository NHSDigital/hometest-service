import { generateDialogHTML } from '../../../../lib/components/session-timer/htmlGenerator';

jest.mock('../../../../lib/components/session-timer/utils', () => ({
  generateDomElementFromString: jest.fn((html) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    const el = template.content.firstChild as HTMLElement;
    if (html.includes('app-timeout-dialog__countdown')) {
      el.textContent = '00:00';
    }
    return el;
  }),
  generateDomElementFromStringAndAppendText: jest.fn((html, text) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    const el = template.content.firstChild as HTMLElement;

    el?.appendChild(document.createTextNode(text));
    return el;
  }),
  hasClass: jest.fn(() => false),
  addClass: jest.fn(),
  removeClass: jest.fn()
}));

describe('HTML Generator', () => {
  it('creates dialog with heading and message', () => {
    const timeoutDialogParams = {
      title: 'Session Timeout',
      message: 'You will be logged out soon.'
    };
    const result = generateDialogHTML(timeoutDialogParams);
    const heading = (result.$element as HTMLElement | null)?.querySelector(
      '#app-timeout-dialog__heading'
    );
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toBe('Session Timeout');
    const message = (result.$element as HTMLElement | null)?.querySelector(
      '.app-timeout-dialog__message'
    );
    expect(message).not.toBeNull();
    expect(message?.textContent).toContain('You will be logged out soon.');
    const countdown = (result.$element as HTMLElement | null)?.querySelector(
      '#app-timeout-dialog__countdown'
    );
    expect(countdown).not.toBeNull();
    expect(countdown?.textContent).toBe('00:00');
  });
  it('creates dialog with keep alive button and sign out link', () => {
    const timeoutDialogParams = {
      title: 'Session Timeout',
      message: 'You will be logged out soon.',
      keepAliveButtonText: 'Stay signed in',
      signOutButtonText: 'Sign out'
    };
    const result = generateDialogHTML(timeoutDialogParams);
    const staySignedInButton = (
      result.$element as HTMLElement | null
    )?.querySelector('#app-timeout-keep-signin-btn');
    expect(staySignedInButton).not.toBeNull();
    expect(staySignedInButton?.textContent).toBe('Stay signed in');
    const signOutLink = (result.$element as HTMLElement | null)?.querySelector(
      '#app-timeout-sign-out-link'
    );
    expect(signOutLink).not.toBeNull();
    expect(signOutLink?.textContent).toBe('Sign out');
  });
  it('creates dialog with message suffix', () => {
    const timeoutDialogParams = {
      title: 'Session Timeout',
      message: 'You will be logged out soon.',
      messageSuffix: 'Click to stay signed in.'
    };
    const result = generateDialogHTML(timeoutDialogParams);
    const message = (result.$element as HTMLElement | null)?.querySelector(
      '.app-timeout-dialog__message'
    );
    expect(message).not.toBeNull();
    expect(message?.textContent).toContain('Click to stay signed in.');
  });
});
