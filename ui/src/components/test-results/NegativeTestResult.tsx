import { AboutService } from "@/components/AboutService";
import { MedicalAbbreviationsHelp } from "@/components/test-results/MedicalAbbreviationsHelp";
import { MoreOptionsAndInformation } from "@/components/test-results/MoreOptionsAndInformation";
import { OpensInNewTabLink } from "../OpensInNewTabLink";
import { OrderDetails } from "@/lib/models/order-details";
import { OrderStatusHeader } from "@/components/order-status";
import { usePageContent } from "@/hooks";

interface NegativeTestResultProps {
  order: OrderDetails;
}

export function NegativeTestResult({ order }: NegativeTestResultProps) {
  const content = usePageContent("test-results").negativeResult;
  const contactSupplierText = content.contactSupplier.replace(
    "{supplier}",
    order.supplier,
  );

  return (
    <>
      <OrderStatusHeader order={order} heading={content.header} />
      <section aria-label={content.sectionAriaLabel}>
        <h3 className="nhsuk-heading-s nhsuk-u-margin-0">
          {content.yourResultHeading}
        </h3>
        <h2 className="nhsuk-heading-m">{content.result}</h2>
        <p className="nhsuk-body">{content.summary}</p>
        <p className="nhsuk-body">{content.windowPeriodAdvice}</p>
        <p className="nhsuk-body">
          {`${content.contactSupplierPrefix} `}
          <OpensInNewTabLink linkHref={"#"} linkText={contactSupplierText} />.
        </p>
        <p className="nhsuk-body">{content.gpSharing}</p>

        <h2 className="nhsuk-heading-m nhsuk-u-margin-top-6">
          {content.nextStepsHeading}
        </h2>
        <p className="nhsuk-body">{content.nextStepsAdvice}</p>
      </section>
      <hr />
      <MoreOptionsAndInformation supplier={order.supplier} />
      <AboutService supplier={order.supplier} />
      <hr />
      <MedicalAbbreviationsHelp />
    </>
  );
}
