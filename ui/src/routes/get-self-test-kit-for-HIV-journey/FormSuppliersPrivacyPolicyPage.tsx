import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { SuppliersPrivacyPolicyContent } from "@/components/SuppliersPrivacyPolicyContent";

export default function FormSuppliersPrivacyPolicyPage() {
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
      <SuppliersPrivacyPolicyContent supplier={supplier} />
    </FormPageLayout>
  );
}
