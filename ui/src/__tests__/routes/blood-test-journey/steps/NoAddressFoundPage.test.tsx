import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NoAddressFoundPage } from '../../../../routes/blood-test-journey/steps/NoAddressFoundPage';
import {
  getStepUrl,
  RoutePath,
  JourneyStepNames
} from '../../../../lib/models/route-paths';
import userEvent from '@testing-library/user-event';

describe('NoAddressFoundPage tests', () => {
  const order = {
    searchParams: {
      postcode: 'ABC 123',
      buildingNumber: '15'
    }
  };

  it('renders the page with all search params', async () => {
    render(
      <BrowserRouter>
        <NoAddressFoundPage order={order} />
      </BrowserRouter>
    );

    // assert
    const noAddressFoundText = `We could not find an address that matches ${order.searchParams.postcode} and ${order.searchParams.buildingNumber}.`;

    expect(await screen.findByText('No address found')).toBeInTheDocument();
    expect(
      await screen.findByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          element?.getAttribute('aria-label')?.valueOf() === noAddressFoundText
        );
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          element?.textContent === noAddressFoundText
        );
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /Try a new search/i
      })
    ).toHaveAttribute(
      'href',
      `${getStepUrl(RoutePath.BloodTestJourney, JourneyStepNames.FindAddressPage)}`
    );
    expect(
      screen.getByRole('link', {
        name: /Enter address manually/i
      })
    ).toHaveAttribute(
      'href',
      `${getStepUrl(RoutePath.BloodTestJourney, JourneyStepNames.EnterAddressPage)}`
    );
  });

  it('renders the page without building number if its empty', async () => {
    // act
    render(
      <BrowserRouter>
        <NoAddressFoundPage
          order={{
            searchParams: {
              postcode: order.searchParams.postcode
            }
          }}
        />
      </BrowserRouter>
    );

    // assert
    const noAddressFoundText = `We could not find an address that matches ${order.searchParams.postcode}.`;

    // h1
    expect(await screen.findByText('No address found')).toBeInTheDocument();

    // aria label for screenreader
    expect(
      await screen.findByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          element?.getAttribute('aria-label')?.valueOf() === noAddressFoundText
        );
      })
    ).toBeInTheDocument();

    // sighted user text
    expect(
      await screen.findByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          element?.textContent === noAddressFoundText
        );
      })
    ).toBeInTheDocument();
  });

  it('clears address and saves postcode after clicking link', async () => {
    const order = {
      searchParams: {
        postcode: 'ABC 123'
      },
      address: {
        addressLine1: 'line 1',
        addressLine2: 'line 2',
        addressLine3: 'line 3',
        townCity: 'city',
        postcode: 'DEF 456'
      }
    };

    render(
      <BrowserRouter>
        <NoAddressFoundPage order={order} />
      </BrowserRouter>
    );

    // act
    const link = screen.getByRole('link', {
      name: /Enter address manually/i
    });
    await userEvent.click(link);

    // assert
    expect(order.address.postcode).toEqual('ABC 123');
    expect(order.address.addressLine1).toBeUndefined();
    expect(order.address.addressLine2).toBeUndefined();
    expect(order.address.addressLine3).toBeUndefined();
    expect(order.address.townCity).toBeUndefined();
  });
});
