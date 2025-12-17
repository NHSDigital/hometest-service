import { useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface RheumatoidArthritisPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function RheumatoidArthritisPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<RheumatoidArthritisPageProps>) {
  const errorMessage =
    'Select if a healthcare professional has ever diagnosed you with rheumatoid arthritis';
  const title =
    'Has a healthcare professional ever diagnosed you with rheumatoid arthritis?';
  const hint =
    'Rheumatoid arthritis is an autoimmune disease. This is different to osteoarthritis. It causes pain, swelling and stiffness in the joints. It usually affects the hands, feet and wrists.';

  const [rheumatoidArthritis, setRheumatoidArthritis] = useState<
    boolean | null
  >(healthCheckAnswers.rheumatoidArthritis ?? null);

  async function handleNext(rheumatoidArthritis: boolean): Promise<void> {
    setRheumatoidArthritis(rheumatoidArthritis);
    await updateHealthCheckAnswers({ rheumatoidArthritis } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={rheumatoidArthritis}
      idOfRadioParent={'rheumatoid-arthritis'}
      booleanTexts={{
        isTrue: 'Yes, they have',
        isFalse: 'No, they have not'
      }}
      hint={hint}
      onContinue={handleNext}
    />
  );
}
