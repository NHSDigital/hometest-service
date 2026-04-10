import { AboutService } from "@/components/AboutService";
import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { OrderStatusHeader } from "@/components/order-status";
import { MedicalAbbreviationsHelp } from "@/components/test-results/MedicalAbbreviationsHelp";
import { MoreOptionsAndInformation } from "@/components/test-results/MoreOptionsAndInformation";
import { usePageContent } from "@/hooks";
import { OrderDetails } from "@/lib/models/order-details";
import supplierService from "@/lib/services/supplier-service";

interface NegativeTestResultProps {
  order: OrderDetails;
}

export function NegativeTestResult({ order }: Readonly<NegativeTestResultProps>) {
  const content = usePageContent("test-results").negativeResult;
  const supplierLinks = supplierService.getLinksBySupplierName(order.supplier);
  const contactSupplierText = content.contactSupplier.replace("{supplier}", order.supplier);

  return (
    <>
      <OrderStatusHeader order={order} heading={content.header} />
      <p className="nhsuk-body nhsuk-u-font-weight-bold nhsuk-u-margin-bottom-2">
        {content.yourResultHeading}
      </p>
      <p className="nhsuk-body nhsuk-u-font-size-26 nhsuk-u-font-weight-bold">{content.result}</p>
      <p className="nhsuk-body">{content.summary}</p>
      <p className="nhsuk-body">{content.windowPeriodAdvice}</p>
      <p className="nhsuk-body">
        {`${content.contactSupplierPrefix} `}
        <OpensInNewTabLink linkHref={supplierLinks.contact} linkText={contactSupplierText} />.
      </p>
      <p className="nhsuk-body">{content.gpSharing}</p>

      <h2 className="nhsuk-heading-m nhsuk-u-margin-top-6">{content.nextStepsHeading}</h2>
      <p className="nhsuk-body">{content.nextStepsAdvice}</p>

      <hr />
      <MoreOptionsAndInformation supplier={order.supplier} />
      <AboutService supplier={order.supplier} />
      <hr />
      <MedicalAbbreviationsHelp />
    </>
  );
}
