import { Button, Card } from 'nhsuk-react-components';
import { useNavigate } from 'react-router-dom';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';

export default function ProblemFindingAddressPage() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate(
      getStepUrl(RoutePath.BloodTestJourney, JourneyStepNames.EnterAddressPage)
    );
  };

  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            Sorry, there was a problem finding your delivery address
          </Card.Heading>
        </Card.Content>
      </Card>
      <div>
        <p>
          There was a problem with the service. You can enter your address
          manually instead.
        </p>
        <Button onClick={handleNext}>Enter your delivery address</Button>
      </div>
    </>
  );
}
