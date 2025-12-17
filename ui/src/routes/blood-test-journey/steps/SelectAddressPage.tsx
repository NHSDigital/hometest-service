import { Radios, ErrorSummary } from 'nhsuk-react-components';
import { useState } from 'react';
import {
  type Address,
  type IHealthCheckBloodTestOrder,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { Link } from 'react-router-dom';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import { addressTextInputMaxLength } from '../../../settings';

interface SelectAddressPageProps {
  selectedAddress?: IHealthCheckBloodTestOrder;
  addressList: Address[];
  updateHealthCheckBloodTestOrder: (
    address: IHealthCheckBloodTestOrder
  ) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function SelectAddressPage({
  selectedAddress,
  addressList,
  updateHealthCheckBloodTestOrder,
  healthCheck,
  patientId
}: Readonly<SelectAddressPageProps>) {
  const error = 'Select your delivery address';

  const [errorsPresent, setErrorsPresent] = useState<boolean>(false);
  const { setIsPageInError } = usePageTitleContext();

  const [address, setAddress] = useState<Address | undefined | null>(
    selectedAddress?.address
  );

  const { triggerAuditEvent } = useAuditEvent();

  const isValid = (): boolean => {
    // Check if address was selected
    // and if the selected address is on the currently displayed list (as search params could have been changed by going back)
    return (
      address !== undefined &&
      addressList
        .map(getAddressKey)
        .find((key) => (address ? key === getAddressKey(address) : '')) !==
        undefined
    );
  };

  const handleNext = async () => {
    if (!isValid()) {
      setErrorsPresent(true);
      setIsPageInError(true);

      return false;
    }

    validateIfAddressLinesAreTooLong();

    const addressToUpdate: IHealthCheckBloodTestOrder = {
      address: address!,
      isBloodTestSectionSubmitted: false
    };
    await updateHealthCheckBloodTestOrder(addressToUpdate);
    return true;
  };

  function validateIfAddressLinesAreTooLong() {
    const inputMaxLength = addressTextInputMaxLength
      ? +addressTextInputMaxLength
      : 35;

    const addressLine1 = address?.addressLine1 ?? '';
    const addressLine2 = address?.addressLine2 ?? '';
    const addressLine3 = address?.addressLine3 ?? '';

    if (
      addressLine1.length > inputMaxLength ||
      addressLine2.length > inputMaxLength ||
      addressLine3.length > inputMaxLength
    ) {
      void triggerAuditEvent({
        healthCheck,
        patientId,
        eventType: AuditEventType.AddressLookupSelectionTooLong
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onLocationChange(e: any) {
    setAddress(addressList[e.target.value]);
  }

  function getAddressKey(address: Address): string {
    return `${address.addressLine1}${address.addressLine2}${address.addressLine3}${address.postcode}${address.townCity}`.replaceAll(
      /\s+/g,
      ''
    );
  }

  function getAddressDisplayText(address: Address): string {
    return [
      address.addressLine1,
      address.addressLine2,
      address.addressLine3,
      address.townCity,
      address.postcode
    ]
      .filter((field) => field !== undefined && field.trim() !== '')
      .join(', ');
  }

  const { postcode, buildingNumber } = selectedAddress?.searchParams ?? {};
  const searchResultsMessage = `Showing search results for ${postcode}`;
  const fullSearchResultsMessage = buildingNumber
    ? `${searchResultsMessage} and ${buildingNumber}.`
    : `${searchResultsMessage}.`;

  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#address-1">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <h1>{`${addressList.length} addresses found`}</h1>
      <p aria-label={fullSearchResultsMessage}>
        {'Showing search results for '}
        <span className="nhsuk-u-font-weight-bold">{postcode}</span>
        {buildingNumber && (
          <>
            {' and '}
            <span className="nhsuk-u-font-weight-bold">{buildingNumber}</span>
          </>
        )}
        {'.'}
      </p>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.FindAddressPage
          )}
        >
          Search again
        </Link>
      </p>
      <RadiosWrapper
        legend={'Select your delivery address'}
        legendProps={{
          size: 'm'
        }}
        id="address"
        onChange={onLocationChange}
        error={errorsPresent ? error : ''}
      >
        {addressList.map((item, index) => {
          return (
            <Radios.Radio
              key={getAddressKey(item)}
              name="address"
              value={index}
              checked={
                address ? getAddressKey(address) === getAddressKey(item) : false
              }
            >
              {getAddressDisplayText(item)}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <EventAuditButton
        onClick={handleNext}
        auditEvents={[
          {
            eventType: AuditEventType.DeliveryAddressSelected,
            healthCheck,
            patientId
          }
        ]}
      >
        Use this address
      </EventAuditButton>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.EnterAddressPage
          )}
        >
          Enter address manually
        </Link>
      </p>
    </>
  );
}
