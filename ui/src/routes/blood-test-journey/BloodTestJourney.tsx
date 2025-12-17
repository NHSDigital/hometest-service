import { BloodTestDeclarationPage } from './steps/BloodTestDeclarationPage';
import EnterAddressPage from './steps/EnterAddressPage';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useHealthCheck,
  useHealthCheckBloodTestOrderMutation
} from '../../hooks/healthCheckHooks';
import NeedBloodTestPage from './steps/NeedBloodTestPage';
import PageLayout from '../../layouts/PageLayout';
import {
  RoutePath,
  getStepUrl,
  JourneyStepNames
} from '../../lib/models/route-paths';
import {
  type Address,
  type IHealthCheckBloodTestOrder,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import ConfirmDetailsPage from './steps/ConfirmDetailsPage';
import BloodTestOrderedPage from './steps/BloodTestOrderedPage';
import FindAddressPage from './steps/FindAddressPage';
import ProblemFindingAddressPage from './steps/ProblemFindingAddressPage';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import addressSearchService, {
  type AddressSearchResponse
} from '../../services/address-search-service';
import SelectAddressPage from './steps/SelectAddressPage';
import { NoAddressFoundPage } from './steps/NoAddressFoundPage';
import { addressTextInputMaxLength } from '../../settings';
import _ from 'lodash';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import EnterPhoneNumberPage from './steps/EnterPhoneNumberPage';
import { type SubmitValidationResult } from '../../lib/components/FormButton';
import { Spinner } from '../../lib/pages/spinner';

export default function BloodTestJourney() {
  const inputMaxLength = addressTextInputMaxLength
    ? +addressTextInputMaxLength
    : 35;
  const navigate = useNavigate();
  const { triggerAuditEvent } = useAuditEvent();
  const [addressList, setAddressList] = useState<Address[] | undefined>(
    undefined
  );
  const [invalidTmpAddress, setInvalidTmpAddress] = useState<
    IHealthCheckBloodTestOrder | undefined
  >();

  const updateHealthCheck = useHealthCheckBloodTestOrderMutation();
  const submitHealthCheck = useHealthCheckBloodTestOrderMutation();
  const healthCheck = useHealthCheck();
  const addressService = addressSearchService;
  const bloodTestOrderRef = useRef<IHealthCheckBloodTestOrder>();

  const { setCurrentStep } = usePageTitleContext();

  const [searchParams] = useSearchParams({
    step: JourneyStepNames.BloodTestDeclarationPage
  });
  const currentStep = searchParams.get('step');
  const showSubmittedBanner =
    searchParams.get('from') === RoutePath.CheckAndSubmitYourAnswersPage;

  const getUnescapedBloodTestOrder = useCallback(() => {
    const bloodTestOrder = healthCheck.data?.bloodTestOrder;

    if (bloodTestOrder) {
      if (bloodTestOrder.address) {
        bloodTestOrder.address = _.mapValues(bloodTestOrder.address, (value) =>
          _.unescape(value)
        );
      }
      if (bloodTestOrder.searchParams) {
        bloodTestOrder.searchParams = _.mapValues(
          bloodTestOrder.searchParams,
          (value) => _.unescape(value)
        );
      }

      return bloodTestOrder;
    }

    return {} as IHealthCheckBloodTestOrder;
  }, [healthCheck]);

  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      bloodTestOrderRef.current = getUnescapedBloodTestOrder();
    }
    setCurrentStep(currentStep ?? undefined);
    return () => {
      setCurrentStep(undefined);
    };
  }, [
    navigate,
    updateHealthCheck,
    currentStep,
    healthCheck.data,
    setCurrentStep,
    getUnescapedBloodTestOrder
  ]);

  useEffect(() => {
    if (submitHealthCheck.isSuccess) {
      submitHealthCheck.reset();
      navigate(
        getStepUrl(
          RoutePath.BloodTestJourney,
          JourneyStepNames.BloodTestOrderedPage
        )
      );
    }
  }, [navigate, submitHealthCheck]);

  async function updateHealthCheckBloodTestOrder(
    bloodTestOrder: Partial<IHealthCheckBloodTestOrder>
  ) {
    // If we selected an address that is too long to pass validation
    if (
      bloodTestOrder.address !== undefined &&
      isAddressLineFieldLengthValid(bloodTestOrder.address) === false
    ) {
      await updateHealthCheck.mutateAsync({
        bloodTestOrder: {
          ...bloodTestOrder,
          address: null
        }
      });

      setInvalidTmpAddress({
        ...healthCheck.data?.bloodTestOrder,
        address: bloodTestOrder.address ?? null
      });
      navigate(
        getStepUrl(
          RoutePath.BloodTestJourney,
          JourneyStepNames.EnterAddressPage
        )
      );
      return;
    }
    await updateHealthCheck.mutateAsync({ bloodTestOrder });
    navigate(
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.EnterPhoneNumberPage
      )
    );
  }
  async function updateHealthCheckBloodTestOrderPhone(
    bloodTestOrder: Partial<IHealthCheckBloodTestOrder>
  ) {
    await updateHealthCheck.mutateAsync({ bloodTestOrder });
    navigate(
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.ConfirmDetailsPage
      )
    );
  }
  async function getAddressList(
    postcode: string,
    buildingNumber?: string
  ): Promise<AddressSearchResponse> {
    const addressSearchResponse = await addressService.searchForAddress(
      postcode,
      buildingNumber
    );
    setAddressList(addressSearchResponse.addressList);
    void triggerAuditEvent({
      eventType: AuditEventType.AddressLookupPerformed,
      healthCheck: healthCheck?.data,
      patientId: healthCheck.data?.patientId ?? '',
      details: {
        totalResults: addressSearchResponse.allAddressesNumber,
        filteredResults: addressSearchResponse.addressList.length
      }
    });

    return addressSearchResponse;
  }

  async function searchForAddress(
    bloodTestOrder: Partial<IHealthCheckBloodTestOrder>
  ) {
    if (bloodTestOrder.searchParams?.postcode) {
      const addressSearchResponse = await getAddressList(
        bloodTestOrder.searchParams?.postcode,
        bloodTestOrder.searchParams?.buildingNumber
      );
      if (addressSearchResponse.addressList.length === 1) {
        if (
          isAddressLineFieldLengthValid(
            addressSearchResponse.addressList[0]
          ) === false
        ) {
          void triggerAuditEvent({
            healthCheck: healthCheck?.data,
            patientId: healthCheck.data?.patientId,
            eventType: AuditEventType.AddressLookupSelectionTooLong
          });

          await updateHealthCheck.mutateAsync({
            bloodTestOrder: {
              ...bloodTestOrder,
              address: null
            }
          });
          setInvalidTmpAddress({
            ...bloodTestOrder,
            address: addressSearchResponse.addressList[0]
          });
          navigate(
            getStepUrl(
              RoutePath.BloodTestJourney,
              JourneyStepNames.EnterAddressPage
            )
          );
          return;
        }
        await updateHealthCheck.mutateAsync({
          bloodTestOrder: {
            ...bloodTestOrder,
            address: addressSearchResponse.addressList[0]
          }
        });
        navigate(
          getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.EnterPhoneNumberPage
          )
        );
      } else if (addressSearchResponse.addressList.length > 1) {
        await updateHealthCheck.mutateAsync({ bloodTestOrder });
        navigate(
          getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.SelectAddressPage
          )
        );
      } else {
        await updateHealthCheck.mutateAsync({ bloodTestOrder });
        navigate(
          getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.NoAddressFoundPage
          )
        );
      }
    } else {
      console.log('No postcode supplied');
    }
  }

  function isAddressLineFieldLengthValid(address: Address | null): boolean {
    return (
      !address ||
      (isCorrectLength(address.addressLine1) &&
        isCorrectLength(address.addressLine2) &&
        isCorrectLength(address.addressLine3))
    );
  }

  async function submitHealthCheckBloodTestOrder(): Promise<SubmitValidationResult> {
    await submitHealthCheck.mutateAsync({
      bloodTestOrder: {
        ...bloodTestOrderRef.current,
        isBloodTestSectionSubmitted: true
      } as unknown as Partial<IHealthCheckBloodTestOrder>
    });

    void triggerAuditEvent({
      eventType: AuditEventType.DeliveryAddressConfirmed,
      healthCheck: healthCheck?.data,
      patientId: healthCheck.data?.patientId
    });

    return {
      isSubmitValid: true
    };
  }

  async function onContinue(): Promise<void> {
    await updateHealthCheck.mutateAsync({
      bloodTestOrder: {
        isBloodTestSectionSubmitted: false
      } as unknown as Partial<IHealthCheckBloodTestOrder>
    });
    navigate(
      getStepUrl(RoutePath.BloodTestJourney, JourneyStepNames.FindAddressPage)
    );
  }

  function filterOutEmptyAddressLines(): string[] {
    const order =
      bloodTestOrderRef.current ?? ({} as IHealthCheckBloodTestOrder);
    const addressLines = [
      order.address?.addressLine1,
      order.address?.addressLine2,
      order.address?.addressLine3,
      order.address?.townCity,
      order.address?.postcode
    ];
    return addressLines.filter(
      (line: string | undefined) => line !== undefined && line !== ''
    ) as string[];
  }

  function isCorrectLength(value: string): boolean {
    return _.escape(value).length <= inputMaxLength;
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    bloodTestOrderRef.current = getUnescapedBloodTestOrder();
  }

  switch (currentStep) {
    case JourneyStepNames.BloodTestDeclarationPage:
      return renderStep(
        <BloodTestDeclarationPage
          showSubmittedBanner={showSubmittedBanner}
          onContinue={() => {
            void onContinue();
          }}
          healthCheck={healthCheck.data!}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.EnterAddressPage:
      if (invalidTmpAddress) {
        healthCheck.data = healthCheck.data ?? ({} as IHealthCheck);
        healthCheck.data.bloodTestOrder = { ...invalidTmpAddress };
        setInvalidTmpAddress(undefined);
      }
      return renderStep(
        <EnterAddressPage
          order={
            bloodTestOrderRef.current ?? ({} as IHealthCheckBloodTestOrder)
          }
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrder}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.EnterPhoneNumberPage:
      return renderStep(
        <EnterPhoneNumberPage
          enteredPhoneNumber={
            bloodTestOrderRef.current ?? ({} as IHealthCheckBloodTestOrder)
          }
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderPhone}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.FindAddressPage:
      return renderStep(
        <FindAddressPage
          order={
            bloodTestOrderRef.current ?? ({} as IHealthCheckBloodTestOrder)
          }
          searchForAddress={searchForAddress}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.NeedBloodTestPage:
      return renderStep(
        <NeedBloodTestPage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.ConfirmDetailsPage:
      return renderStep(
        <ConfirmDetailsPage
          bloodTestOrder={bloodTestOrderRef.current}
          submitAnswers={submitHealthCheckBloodTestOrder}
        />
      );
    case JourneyStepNames.BloodTestOrderedPage:
      return renderStep(
        <BloodTestOrderedPage
          addressLines={filterOutEmptyAddressLines()}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.ProblemFindingAddressPage:
      return renderStep(<ProblemFindingAddressPage />);

    case JourneyStepNames.SelectAddressPage:
      if (
        addressList === undefined &&
        bloodTestOrderRef.current?.searchParams
      ) {
        getAddressList(
          bloodTestOrderRef.current?.searchParams?.postcode,
          bloodTestOrderRef.current?.searchParams?.buildingNumber
        ).catch(() => {
          navigate(
            getStepUrl(
              RoutePath.BloodTestJourney,
              JourneyStepNames.ProblemFindingAddressPage
            )
          );
        });
      }
      // in case browser back navigation is used and we redirect to this page with only one address in list
      if (addressList !== undefined && addressList.length <= 1) {
        navigate(
          getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.FindAddressPage
          )
        );
      }
      return renderStep(
        <SelectAddressPage
          selectedAddress={bloodTestOrderRef.current}
          addressList={addressList ?? []}
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrder}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.NoAddressFoundPage:
      return renderStep(
        <NoAddressFoundPage
          order={
            bloodTestOrderRef.current ?? ({} as IHealthCheckBloodTestOrder)
          }
        />
      );
    default:
      throw new Error(`Page not defined: ${currentStep}`);
  }

  function renderStep(stepComponent: JSX.Element) {
    const backToUrl = (() => {
      switch (currentStep) {
        case JourneyStepNames.BloodTestDeclarationPage:
          return RoutePath.TaskListPage;
        case JourneyStepNames.FindAddressPage:
        case JourneyStepNames.NeedBloodTestPage:
          return getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.BloodTestDeclarationPage
          );
        case JourneyStepNames.BloodTestOrderedPage:
          return undefined;
        case JourneyStepNames.ConfirmDetailsPage:
          return getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.EnterPhoneNumberPage
          );
        default:
          return getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.FindAddressPage
          );
      }
    })();

    return <PageLayout backToUrl={backToUrl}>{stepComponent}</PageLayout>;
  }
}
