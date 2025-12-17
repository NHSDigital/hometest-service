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

interface HoursGardeningPageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (value: IPhysicalActivity) => Promise<void>;
}

export default function HoursGardeningPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<HoursGardeningPageProps>) {
  const [gardeningHours, setGardeningHours] = useState<
    string | null | undefined
  >(healthCheckAnswers.gardeningHours);

  const handleNext = async (): Promise<SubmitValidationResult> => {
    await updateHealthCheckAnswers({
      gardeningHours: gardeningHours
    } as IPhysicalActivity);

    return {
      isSubmitValid: true
    };
  };

  function onGardeningHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    setGardeningHours(e.target.value);
  }

  return (
    <>
      <RadiosWrapper
        legend={
          'How many hours do you spend on gardening or DIY in a typical week? (optional)'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="hours-gardening"
        onChange={onGardeningHoursChange}
        error={''}
      >
        {Object.values(ExerciseHours).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="hours-gardening-item"
              value={item}
              checked={gardeningHours === item}
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
