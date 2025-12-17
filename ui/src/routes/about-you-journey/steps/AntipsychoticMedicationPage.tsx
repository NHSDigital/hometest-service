import { useState } from 'react';
import RadiosConfirm from '../../../lib/components/radios-confirm';
import { type IAboutYou } from '@dnhc-health-checks/shared';

interface AntipsychoticMedicationPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function AntipsychoticMedicationPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<AntipsychoticMedicationPageProps>) {
  const [antipsychoticMedication, setAntipsychoticMedication] = useState<
    boolean | null
  >(healthCheckAnswers.atypicalAntipsychoticMedication ?? null);

  async function handleNext(
    atypicalAntipsychoticMedication: boolean
  ): Promise<void> {
    setAntipsychoticMedication(atypicalAntipsychoticMedication);
    await updateHealthCheckAnswers({
      atypicalAntipsychoticMedication
    } as IAboutYou);
  }

  return (
    <RadiosConfirm
      errorMessage={
        'Select if you are currently taking any of the medicines listed'
      }
      titleOfRadio={'Are you currently taking any of these medicines?'}
      initialValue={antipsychoticMedication}
      idOfRadioParent={'antipsychotic-medication'}
      headingLevel="h2"
      headingSize="m"
      booleanTexts={{
        isTrue: 'Yes, I am',
        isFalse: 'No, I am not'
      }}
      onContinue={handleNext}
    >
      <h1>Medicines for severe mental health conditions</h1>
      <p>
        Medicines called ‘atypical antipsychotics’ are used to treat
        schizophrenia and other psychoses, as well as bipolar disorder and in
        some cases severe depression.
      </p>
      <p>Some of these can be taken as an injection or a tablet.</p>
      <p>The list of atypical antipsychotics includes:</p>

      <ul>
        <li>amisulpride (brand name Solian)</li>
        <li>aripiprazole (Abilify)</li>
        <li>clozapine (Clozaril, Denzapine, Zaponex)</li>
        <li>lurasidone (Latuda)</li>
        <li>olanzapine (Zypadhera, Zyprexa)</li>
        <li>paliperidone (Invega, Xeplion)</li>
        <li>quetiapine (Seroquel, Seroquel XL)</li>
        <li>risperidone (Risperdal, Risperdal Consta)</li>
      </ul>
    </RadiosConfirm>
  );
}
