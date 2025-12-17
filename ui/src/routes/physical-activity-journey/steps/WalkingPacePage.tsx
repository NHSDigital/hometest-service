import { Radios } from 'nhsuk-react-components';
import {
  type IPhysicalActivity,
  WalkingPace
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface WalkingPacePageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (value: IPhysicalActivity) => Promise<void>;
}

export default function WalkingPacePage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<WalkingPacePageProps>) {
  const [walkPace, setWalkPace] = useState<string | null | undefined>(
    healthCheckAnswers.walkPace
  );

  const handleNext = async (): Promise<SubmitValidationResult> => {
    await updateHealthCheckAnswers({ walkPace: walkPace } as IPhysicalActivity);

    return {
      isSubmitValid: true
    };
  };

  function onWalkPaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWalkPace(e.target.value);
  }

  return (
    <>
      <RadiosWrapper
        legend={'How would you describe your usual walking pace? (optional)'}
        legendProps={{
          isPageHeading: true
        }}
        id="walking-pace"
        onChange={onWalkPaceChange}
        error={''}
      >
        {Object.values(WalkingPace).map((item) => (
          <Radios.Radio
            key={item}
            name="pace"
            hint={EnumDescriptions.WalkingPace[item].hint}
            value={item}
            checked={walkPace === item}
          >
            {EnumDescriptions.WalkingPace[item].description}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
