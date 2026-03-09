import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { SuppliersTermsConditionsContent } from "@/components/SuppliersTermsConditionsContent";

export default function FormSuppliersTermsConditionsPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const supplier = orderAnswers.supplier?.[0]?.name;

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.CheckYourAnswers);
        }
      }}
    >
      <SuppliersTermsConditionsContent supplier={supplier} />
    </FormPageLayout>
  );
}
