import { CholesterolBase } from './CholesterolBase';
import { type NewTabLinkArray } from '../../../lib/components/opens-in-new-tab-link';
import { Card, InsetText } from 'nhsuk-react-components';
import { TotalCholesterolCategory } from '@dnhc-health-checks/shared';
import { ImportantCallout } from '../../../lib/components/important-callout';

export class CholesterolPartial extends CholesterolBase {
  totalCholesterolMissing =
    this.cholesterolParams.cholesterolScore.totalCholesterolFailureReason;

  hdlCholesterolMissing =
    this.cholesterolParams.cholesterolScore.hdlCholesterolFailureReason;

  public getPageContent(): JSX.Element {
    const resources: NewTabLinkArray[] = [
      ...(!this.hdlCholesterolMissing
        ? [
            {
              id: 1,
              resource: {
                linkHref:
                  'https://www.heartuk.org.uk/cholesterol/understanding-your-cholesterol-test-results-',
                linkText: 'Understanding your cholesterol results - Heart UK'
              }
            }
          ]
        : []),
      ...(!this.totalCholesterolMissing &&
      this.cholesterolParams.cholesterolScore.totalCholesterolCategory !==
        TotalCholesterolCategory.Normal
        ? [
            {
              id: 2,
              resource: {
                linkHref: 'https://www.nhs.uk/conditions/high-cholesterol/',
                linkText: 'Understanding high cholesterol - NHS UK'
              }
            }
          ]
        : []),
      {
        id: 3,
        resource: {
          linkHref:
            'https://www.nhs.uk/conditions/high-cholesterol/getting-tested/',
          linkText: 'Getting your cholesterol levels tested - NHS'
        }
      }
    ];

    return (
      <>
        {this.getIncompleteTitleCard()}
        {this.getSpeakToGp(
          this.cholesterolParams.cholesterolScore.totalCholesterolCategory ===
            TotalCholesterolCategory.VeryHigh
        )}
        {this.getWhatWeKnow()}
        {this.getPartialCholesterolCards()}
        {this.getUsefulResources(resources, false)}
      </>
    );
  }

  getIncompleteTitleCard(): JSX.Element {
    let description: string;

    if (!this.totalCholesterolMissing) {
      description =
        'The lab could only measure the total amount of cholesterol that is in your bloodstream.';
    } else if (!this.hdlCholesterolMissing) {
      description =
        'The lab could only test the level of good cholesterol (HDL) in your blood sample.';
    } else {
      throw new Error();
    }

    return (
      <Card data-testid="incomplete-cholesterol-results-card">
        <Card.Content>
          <Card.Heading aria-label={`Your cholesterol levels are incomplete`}>
            Your cholesterol levels are incomplete
          </Card.Heading>
          <InsetText
            className={
              'app-card__heading-inset--blue nhsuk-u-margin-bottom-5 nhsuk-u-margin-top-4'
            }
          >
            <p>{description}</p>
          </InsetText>
          <p>
            This does not provide a detailed breakdown of other cholesterol
            levels.
          </p>
          <p>This means we cannot analyse your heart health accurately.</p>
        </Card.Content>
      </Card>
    );
  }

  getSpeakToGp(urgent: boolean): JSX.Element {
    const type = urgent ? 'urgent' : 'non-urgent';

    return (
      <Card cardType={type}>
        <Card.Heading>Speak to your GP surgery to:</Card.Heading>
        <Card.Content>
          <ul>
            <li key="retested">
              book a blood test to retest your cholesterol levels
            </li>
          </ul>
          <p>Your GP surgery has a record of your results so far.</p>
          <p>
            After your blood test, a healthcare professional will provide any
            guidance you may need.
          </p>
        </Card.Content>
      </Card>
    );
  }

  getWhatWeKnow(): JSX.Element {
    return (
      <>
        <h2>What we know so far</h2>
        <ImportantCallout>
          <p>
            These results do not give an accurate picture of your overall
            cholesterol health, as one or more results are missing.
          </p>
        </ImportantCallout>
      </>
    );
  }

  getPartialCholesterolCards(): JSX.Element {
    const totalCholesterolText = 'Your total cholesterol is:';
    const hdlCholesterolText = 'Your level of good cholesterol (HDL) is:';
    const ratioCholesterolText = 'Your total cholesterol to HDL ratio is:';

    return (
      <>
        {this.totalCholesterolMissing && (
          <>
            {this.getGoodHDLCholesterolCard(
              this.cholesterolParams.cholesterolScore.hdlCholesterol!
            )}
            {this.getUnknownScoreCard(
              'total-cholesterol-unknown-card',
              totalCholesterolText,
              'total-cholesterol'
            )}
          </>
        )}
        {this.hdlCholesterolMissing && (
          <>
            {this.getTotalCholesterolCard(
              this.cholesterolParams.cholesterolScore.totalCholesterol!
            )}
            {this.getUnknownScoreCard(
              'hdl-unknown-card',
              hdlCholesterolText,
              'hdl'
            )}
          </>
        )}
        {this.getUnknownScoreCard(
          'ratio-unknown-card',
          ratioCholesterolText,
          'ratio'
        )}
      </>
    );
  }
}
