import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  type SummaryItem,
  SummaryRows
} from '../../../lib/components/summary-row';

describe('SummaryRows component', () => {
  const renderComponent = (items: SummaryItem[]) => {
    render(
      <BrowserRouter>
        <SummaryRows items={items} />
      </BrowserRouter>
    );
  };

  it('renders all summary items correctly', () => {
    const items: SummaryItem[] = [
      {
        id: 'address-postcode',
        key: 'Enter your postcode',
        value: 'some postcode',
        changeLink: '/change-postcode',
        screenReaderSuffix: 'postcode'
      },
      {
        id: 'smoking',
        key: 'Do you smoke?',
        value: 'Yes',
        screenReaderSuffix: '- do you smoke?'
      }
    ];

    renderComponent(items);

    expect(screen.getByText('Enter your postcode')).toBeInTheDocument();
    expect(screen.getByText('some postcode')).toBeInTheDocument();
    expect(screen.getByText('Do you smoke?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Change/i })).toHaveAttribute(
      'href',
      '/change-postcode'
    );
  });

  it('renders change link when changeLink is provided', () => {
    const items: SummaryItem[] = [
      {
        id: 'address-postcode',
        key: 'Enter your postcode',
        value: 'some postcode',
        changeLink: '/change-postcode',
        screenReaderSuffix: 'postcode'
      }
    ];

    renderComponent(items);

    expect(screen.getByText('Change')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Change/i })).toHaveAttribute(
      'href',
      '/change-postcode'
    );
  });

  it('does not render change link when changeLink is not provided', () => {
    const items: SummaryItem[] = [
      {
        id: 'address-postcode',
        key: 'Enter your postcode',
        value: 'some postcode',
        screenReaderSuffix: 'postcode'
      }
    ];

    renderComponent(items);

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('renders change link with hidden span when screenReaderSuffix is provided', () => {
    const items: SummaryItem[] = [
      {
        id: 'address-postcode',
        key: 'Enter your postcode',
        value: 'some postcode',
        changeLink: '/change-postcode',
        screenReaderSuffix: 'postcode'
      }
    ];

    renderComponent(items);

    expect(screen.getByRole('link', { name: /Change/i })).toContainHTML(
      '<span class="nhsuk-u-visually-hidden"> postcode</span>'
    );
  });

  it('renders change link without hidden span when screenReaderSuffix is not provided', () => {
    const items: SummaryItem[] = [
      {
        id: 'address-postcode',
        key: 'Enter your postcode',
        value: 'some postcode',
        changeLink: '/change-postcode',
        screenReaderSuffix: ''
      }
    ];

    renderComponent(items);

    expect(screen.getByRole('link', { name: /Change/i })).not.toContainHTML(
      '<span class="nhsuk-u-visually-hidden"> postcode</span>'
    );
  });
});
