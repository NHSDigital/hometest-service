import { useNavigate } from 'react-router-dom';
import { Button } from 'nhsuk-react-components';

interface EverydayMovementPageProps {
  nextStepUrl: string;
}

export default function EverydayMovementPage({
  nextStepUrl
}: Readonly<EverydayMovementPageProps>) {
  const navigate = useNavigate();

  const handleNext = (): void => {
    navigate(nextStepUrl);
  };

  return (
    <>
      <h1>Everyday movement</h1>
      <p>We have 2 more questions about your daily activities, including:</p>
      <ul>
        <li>housework and childcare</li>
        <li>gardening and DIY</li>
      </ul>
      <p>
        These questions are optional. Your answers will help us give you the
        best advice for your lifestyle.
      </p>
      <Button onClick={handleNext}>Continue</Button>
    </>
  );
}
