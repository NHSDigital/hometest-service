import {
  SummaryRows,
  type SummaryItem
} from '../../../lib/components/summary-row';
import { type IHealthCheckBloodTestOrder } from '@dnhc-health-checks/shared';
import {
  JourneyStepNames,
  RoutePath,
  getStepUrl
} from '../../../lib/models/route-paths';
interface IBloodTestSummaryRowsProps {
  name: string;
  bloodTestAnswers?: IHealthCheckBloodTestOrder;
}
export default function BloodTestSummaryRows({
  bloodTestAnswers,
  name
}: IBloodTestSummaryRowsProps) {
  function getChangeLink(step: string): string {
    return getStepUrl(RoutePath.BloodTestJourney, step);
  }

  const addressLines = [
    name,
    bloodTestAnswers?.address?.addressLine1,
    bloodTestAnswers?.address?.addressLine2,
    bloodTestAnswers?.address?.addressLine3,
    bloodTestAnswers?.address?.townCity,
    bloodTestAnswers?.address?.postcode
  ].filter((line): line is string => Boolean(line));
  let phoneNumber = 'Not provided';
  if (bloodTestAnswers?.phoneNumber?.trim()) {
    phoneNumber = bloodTestAnswers?.phoneNumber;
  }

  const items: SummaryItem[] = [
    {
      id: 'address',
      key: 'Delivery address',
      value: addressLines,
      changeLink: getChangeLink(JourneyStepNames.EnterAddressPage),
      screenReaderSuffix: '- Delivery address'
    },
    {
      id: 'phoneNumber',
      key: 'UK mobile phone number',
      value: phoneNumber,
      changeLink: getChangeLink(JourneyStepNames.EnterPhoneNumberPage),
      screenReaderSuffix: '- UK mobile phone number'
    }
  ];

  return <SummaryRows items={items} />;
}
