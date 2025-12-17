import { Button, Details, InsetText } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';

interface MeasureYourWaistPageProps {
  onContinue: () => void;
}

export default function MeasureYourWaistPage({
  onContinue
}: MeasureYourWaistPageProps) {
  return (
    <>
      <h1>Measure your waist</h1>
      <p>
        We need your waist measurement to help calculate your risk of type 2
        diabetes.
      </p>
      <h2>How to measure your waist</h2>
      <InsetText className="nhsuk-u-margin-bottom-5 nhsuk-u-margin-top-4">
        <p>
          Many of us underestimate our waist size. An accurate measurement is
          important. Use a soft tape measure for the best result.
        </p>
      </InsetText>
      <ol>
        <li>
          Measure on bare skin if you can. If not, measure wearing one thin
          layer of clothing.
        </li>
        <li>
          Find the middle point between your lowest rib and your hip bone. This
          will be roughly level with your belly button.
        </li>
        <li>
          Wrap a tape measure around this middle point, breathing naturally and
          not holding your tummy in.
        </li>
      </ol>
      <Details>
        <Details.Summary>I do not have a soft tape measure</Details.Summary>
        <Details.Text>
          <p>
            If you do not have a soft tape measure, use a piece of string. Wrap
            it around your waist and mark where it meets. Then measure this
            against a ruler or metal tape measure.
          </p>
          <p>
            You can also get your waist measured at some gyms and local
            pharmacies.
          </p>
        </Details.Text>
      </Details>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.youtube.com/watch?v=dwk8sVCKuio"
          linkText="Watch an NHS video of how to measure your waist"
        />
      </p>
      <Button onClick={onContinue}>Continue</Button>
    </>
  );
}
