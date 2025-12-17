import { Link } from 'react-router-dom';
import {
  getStepUrl,
  RoutePath,
  JourneyStepNames
} from '../../../lib/models/route-paths';
import {
  type Address,
  type IHealthCheckBloodTestOrder
} from '@dnhc-health-checks/shared';

interface NoAddressFoundPageProps {
  order: Partial<IHealthCheckBloodTestOrder>;
}

export function NoAddressFoundPage({ order }: NoAddressFoundPageProps) {
  const cleanAddressLeavePostcode = () => {
    order.address = {
      postcode: order.searchParams?.postcode
    } as Address;
  };

  const { postcode, buildingNumber } = order.searchParams ?? {};
  const addressNotFoundMessage = `We could not find an address that matches ${postcode}`;
  const fullAddressNotFoundMessage = buildingNumber
    ? `${addressNotFoundMessage} and ${buildingNumber}.`
    : `${addressNotFoundMessage}.`;

  return (
    <>
      <h1>No address found</h1>
      <p aria-label={fullAddressNotFoundMessage}>
        {'We could not find an address that matches '}
        <span className="nhsuk-u-font-weight-bold">{postcode}</span>
        {buildingNumber && (
          <>
            {' and '}
            <span className="nhsuk-u-font-weight-bold">{buildingNumber}</span>
          </>
        )}
        .
      </p>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.FindAddressPage
          )}
        >
          Try a new search
        </Link>
      </p>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.EnterAddressPage
          )}
          onClick={cleanAddressLeavePostcode}
        >
          Enter address manually
        </Link>
      </p>
    </>
  );
}
