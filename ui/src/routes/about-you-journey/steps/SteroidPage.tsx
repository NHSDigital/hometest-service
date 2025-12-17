import { useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface SteroidPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function SteroidPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<SteroidPageProps>) {
  const [steroid, setSteroid] = useState<boolean | null>(
    healthCheckAnswers.steroidTablets ?? null
  );

  async function handleNext(steroidTablets: boolean): Promise<void> {
    setSteroid(steroidTablets);
    await updateHealthCheckAnswers({ steroidTablets } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={'Select if you regularly take steroid tablets'}
      titleOfRadio={'Do you regularly take corticosteroid tablets?'}
      initialValue={steroid}
      idOfRadioParent={'steroid'}
      headingLevel="h3"
      headingSize="m"
      booleanTexts={{
        isTrue: 'Yes, I do',
        isFalse: 'No, I do not'
      }}
      hint="Regularly means you had at least 2 prescriptions in the last year, and 1 of those has been in the last 28 days."
      onContinue={handleNext}
    >
      <h1>Corticosteroid tablets</h1>
      <p>
        Corticosteroid tablets are a type of anti-inflammatory medicine
        prescribed by healthcare professionals.
      </p>
      <p>
        They help treat conditions like asthma, skin conditions and autoimmune
        diseases.
      </p>
      <p>The full list of corticosteroid tablets is:</p>

      <ul>
        <li>prednisolone</li>
        <li>betamethasone</li>
        <li>dexamethasone</li>
        <li>hydrocortisone</li>
      </ul>
      <p>
        We are only asking about corticosteroid tablets as part of the health
        check, not creams, inhalers or other forms.
      </p>
    </RadiosConfirm>
  );
}
