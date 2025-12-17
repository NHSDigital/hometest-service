import { useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface ErectileDysfunctionPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function ErectileDysfunctionPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<ErectileDysfunctionPageProps>) {
  const errorMessage =
    'Select if a healthcare professional has ever diagnosed you with erectile dysfunction, or you have ever taken medicine for it';
  const title =
    'Has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?';
  const hint =
    'Erectile dysfunction (impotence) is when you are unable to get or keep an erection long enough to have sex.';

  const [impotence, setImpotence] = useState<boolean | null>(
    healthCheckAnswers.impotence ?? null
  );

  async function handleNext(impotence: boolean): Promise<void> {
    setImpotence(impotence);
    await updateHealthCheckAnswers({
      impotence
    } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={impotence}
      idOfRadioParent={'impotence'}
      booleanTexts={{
        isTrue: 'Yes',
        isFalse: 'No'
      }}
      hint={hint}
      onContinue={handleNext}
    />
  );
}
