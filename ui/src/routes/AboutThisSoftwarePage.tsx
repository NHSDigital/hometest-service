import { Button, InsetText, SummaryList } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';
import { RoutePath } from '../lib/models/route-paths';
import { dateOfManufacture, nhtVersion } from '../settings';
import { OpensInNewTabLink } from '../lib/components/opens-in-new-tab-link';
import { Fragment } from 'react/jsx-runtime';

interface SoftwareSummaryRowProps {
  key: string;
  value: string | string[];
  icon: string;
  altText: string;
  linkHref?: string;
  linkText?: string;
  width?: number;
  height?: number;
}

export default function AboutThisSoftwarePage() {
  function getSoftwareSummaryRow({
    key,
    value,
    icon,
    altText,
    linkHref,
    linkText,
    width = 36,
    height = 22
  }: SoftwareSummaryRowProps): JSX.Element {
    return (
      <SummaryList.Row id={`software-information-row-${key}`}>
        <SummaryList.Key id={`software-information-${key}`} role="presentation">
          <img src={icon} width={width} height={height} alt={altText} />
        </SummaryList.Key>
        <SummaryList.Value id={`software-information-value-${key}`}>
          <p className="nhsuk-body nhsuk-u-font-weight-bold">{key}</p>
          <p className="nhsuk-body block">
            {Array.isArray(value)
              ? value.map((line, index) => (
                  <Fragment key={index}>
                    {line}
                    {index < value.length - 1 && <br />}
                  </Fragment>
                ))
              : value}
          </p>
          {linkHref && linkText && (
            <>
              <p className="nhsuk-body block">
                <OpensInNewTabLink linkHref={linkHref} linkText={linkText} />
              </p>
            </>
          )}
        </SummaryList.Value>
      </SummaryList.Row>
    );
  }

  return (
    <PageLayout
      displayNhsAppServicesBackButton={true}
      backToUrl={RoutePath.StartHealthCheckPage}
    >
      <h1 className="nhsuk-heading-xl">About this software</h1>

      <p>
        The Digital NHS Health Check is a Class 1 Medical Device. The following
        label is appropriate to the product.
      </p>

      <InsetText>
        <h2 className="nhsuk-heading-l">Software information</h2>
        <SummaryList className="software-information" role="presentation">
          {getSoftwareSummaryRow({
            key: 'Software name',
            value: 'Digital NHS Health Check',
            icon: '/assets/images/nhsd-images/md.png',
            altText: 'ISO15223-1:2021 Icon - Medical Device'
          })}
          {getSoftwareSummaryRow({
            key: 'Version',
            value: nhtVersion,
            icon: '/assets/images/nhsd-images/lot.png',
            altText: 'ISO7000/2492 Icon - Catalogue Number'
          })}
          {getSoftwareSummaryRow({
            key: 'Date of manufacture (release)',
            value: dateOfManufacture,
            icon: '/assets/images/nhsd-images/dateofmanufacture.png',
            altText: 'ISO7000/2497 Icon - Date of Manufacture'
          })}
          {getSoftwareSummaryRow({
            key: 'Manufacturer',
            value: [
              'NHS England',
              '7 and 8 Wellington Place',
              'Leeds',
              'West Yorkshire',
              'LS1 4AP'
            ],
            icon: '/assets/images/nhsd-images/manufacturer.png',
            altText: 'ISO7000/3082 Icon - Manufacturer'
          })}
          {getSoftwareSummaryRow({
            key: 'Electronic instructions for use',
            value:
              'Relevant information for use of the Digital NHS Health Check product is available in electronic form rather than printed paper form.',
            icon: '/assets/images/nhsd-images/instructions.png',
            altText: 'ISO7000/3500 Icon - Electronic instructions for use',
            linkHref:
              'https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/help-and-support/instructions-for-use',
            linkText: 'View the instructions for use'
          })}
          {getSoftwareSummaryRow({
            key: 'UKCA mark',
            value:
              'The Digital NHS Health Check complies with the relevant requirements of the UK Medical Devices Regulations 2002 (SI 2002 No 618, as amended) (UK MDR 2002).',
            icon: '/assets/images/nhsd-images/ukca.png',
            altText: 'UK Conformity Assessed Marking',
            width: 40,
            height: 40
          })}
        </SummaryList>
      </InsetText>
      <Button href={RoutePath.StartHealthCheckPage}>Go back</Button>
    </PageLayout>
  );
}
