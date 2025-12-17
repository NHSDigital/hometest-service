import dialog from '../../../../lib/components/session-timer/dialog';

describe('When displayDialog is called', () => {
  let dialogInstance: ReturnType<typeof dialog.displayDialog>;
  let element: HTMLElement;

  beforeEach(() => {
    document.getElementById('app-timeout-dialog')?.remove();
    document.getElementById('app-timeout-overlay')?.remove();

    element = document.createElement('div');
    element.textContent = 'Test Dialog Content';
    dialogInstance = dialog.displayDialog(element);
  });
  afterEach(() => {
    dialogInstance.closeDialog();
  });

  it('should add dialog and overlay elements to the DOM', () => {
    expect(document.getElementById('app-timeout-dialog')).toBeTruthy();
    expect(document.getElementById('app-timeout-overlay')).toBeTruthy();
  });

  it('should remove dialog and overlay from the DOM', () => {
    dialogInstance.closeDialog();
    expect(document.getElementById('app-timeout-dialog')).toBeNull();
    expect(document.getElementById('app-timeout-overlay')).toBeNull();
  });

  it('should set and remove aria-labelledby', () => {
    dialogInstance.setAriaLabelledBy('test-label');
    expect(
      document
        .getElementById('app-timeout-dialog')
        ?.getAttribute('aria-labelledby')
    ).toBe('test-label');
    dialogInstance.setAriaLabelledBy('');
    expect(
      document
        .getElementById('app-timeout-dialog')
        ?.getAttribute('aria-labelledby')
    ).toBeNull();
  });

  it('should call the handler on close', () => {
    const handler = jest.fn();
    dialogInstance.addCloseHandler(handler);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(handler).toHaveBeenCalled();
  });
});
