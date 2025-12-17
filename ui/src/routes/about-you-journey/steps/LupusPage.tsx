import { useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface LupusPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function LupusPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<LupusPageProps>) {
  const errorMessage =
    'Select if a healthcare professional has ever diagnosed you with lupus';
  const title = 'Has a healthcare professional ever diagnosed you with lupus?';
  const hint =
    'Lupus (systemic lupus erythematosus) is a condition that affects the immune system. It can cause problems with your skin, joints, kidneys and other organs.';

  const [lupus, setLupus] = useState<boolean | null>(
    healthCheckAnswers.lupus ?? null
  );

  async function handleNext(lupus: boolean): Promise<void> {
    setLupus(lupus);
    await updateHealthCheckAnswers({ lupus } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={lupus}
      idOfRadioParent={'lupus'}
      booleanTexts={{
        isTrue: 'Yes, they have',
        isFalse: 'No, they have not'
      }}
      hint={hint}
      onContinue={handleNext}
    />
  );
}
