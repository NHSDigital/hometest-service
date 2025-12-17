import { useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface MigrainesPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function MigrainesPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<MigrainesPageProps>) {
  const errorMessage =
    'Select if a healthcare professional has ever diagnosed you with migraines';
  const title =
    'Has a healthcare professional ever diagnosed you with migraines?';

  const [migraines, setMigraines] = useState<boolean | null>(
    healthCheckAnswers.migraines ?? null
  );

  async function handleNext(migraines: boolean): Promise<void> {
    setMigraines(migraines);
    await updateHealthCheckAnswers({ migraines } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={migraines}
      idOfRadioParent={'migraines'}
      booleanTexts={{
        isTrue: 'Yes, they have',
        isFalse: 'No, they have not'
      }}
      onContinue={handleNext}
    />
  );
}
