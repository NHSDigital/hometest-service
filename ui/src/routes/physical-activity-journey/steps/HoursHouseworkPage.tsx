import { Radios } from 'nhsuk-react-components';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface HoursHouseworkPageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (value: IPhysicalActivity) => Promise<void>;
}

export default function HoursHouseworkPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<HoursHouseworkPageProps>) {
  const [houseworkHours, setHouseworkHours] = useState<
    string | null | undefined
  >(healthCheckAnswers.houseworkHours);

  const handleNext = async (): Promise<SubmitValidationResult> => {
    await updateHealthCheckAnswers({
      houseworkHours: houseworkHours
    } as IPhysicalActivity);

    return {
      isSubmitValid: true
    };
  };

  function onHouseworkHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHouseworkHours(e.target.value);
  }

  return (
    <>
      <RadiosWrapper
        legend={
          'How many hours do you spend on housework or childcare in a typical week? (optional)'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="hourshousework"
        onChange={onHouseworkHoursChange}
        error={''}
      >
        {Object.values(ExerciseHours).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="hours"
              value={item}
              checked={houseworkHours === item}
            >
              {EnumDescriptions.ExerciseHours[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
