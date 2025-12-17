import { useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface SevereMentalIllnessPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function SevereMentalIllnessPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<SevereMentalIllnessPageProps>) {
  const errorMessage =
    'Select if a healthcare professional has ever diagnosed you with a severe mental health condition';
  const title =
    'Has a healthcare professional ever diagnosed you with a severe mental health condition?';
  const hint =
    'This includes schizophrenia, bipolar disorder, moderate to severe depression or other mental health conditions that significantly impact your daily life.';

  const [severeMentalIllness, setSevereMentalIllness] = useState<
    boolean | null
  >(healthCheckAnswers.severeMentalIllness ?? null);

  async function handleNext(severeMentalIllness: boolean): Promise<void> {
    setSevereMentalIllness(severeMentalIllness);
    await updateHealthCheckAnswers({ severeMentalIllness } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={severeMentalIllness}
      idOfRadioParent={'severe-mental-illness'}
      booleanTexts={{
        isTrue: 'Yes, they have',
        isFalse: 'No, they have not'
      }}
      hint={hint}
      onContinue={handleNext}
    />
  );
}
