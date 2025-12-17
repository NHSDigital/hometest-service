/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { fireEvent, render, screen } from '@testing-library/react';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));
describe('OpensInNewTabLink', () => {
  const linkUrl = 'url.com';
  const linkText = 'this is link';
  const mockAction = jest.fn();
  const spanSelector = 'span.nhsuk-u-visually-hidden';

  afterEach(() => {
    mockAction.mockReset();
  });

  beforeEach(() => {
    mockAction.mockResolvedValue(null);
    mockTriggerAuditEvent.mockReset();
  });

  it('renders a link with proper properties including opens in new tab text', () => {
    const { container } = render(
      <OpensInNewTabLink
        linkHref={linkUrl}
        linkText={linkText}
      ></OpensInNewTabLink>
    );

    const link = screen.getByRole('link', {
      name: /this is link \(opens in new tab\)/i
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', linkUrl);

    const hiddenSpan = container.querySelector(spanSelector);
    expect(hiddenSpan).not.toBeInTheDocument();
  });

  it('renders a link with proper properties excluding opens in new tab text', () => {
    const { container } = render(
      <OpensInNewTabLink
        linkHref={linkUrl}
        linkText={linkText}
        includeNewTabMessage={false}
      ></OpensInNewTabLink>
    );

    const link = screen.getByRole('link', {
      name: /this is link/i
    });

    expect(link).toBeInTheDocument();

    const hiddenSpan = container.querySelector(spanSelector);
    expect(hiddenSpan).toBeInTheDocument();
    expect(hiddenSpan).toHaveTextContent('(opens in new tab)');
  });

  it('executes passed action onClick', () => {
    render(
      <OpensInNewTabLink
        linkHref={linkUrl}
        linkText={linkText}
        onClick={mockAction}
      ></OpensInNewTabLink>
    );

    const link = screen.getByRole('link', {
      name: /this is link/i
    });

    expect(link).toBeInTheDocument();
    fireEvent.click(link);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
