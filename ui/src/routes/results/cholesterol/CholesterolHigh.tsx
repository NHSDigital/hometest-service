import { Card } from 'nhsuk-react-components';
import { CholesterolBase } from './CholesterolBase';
import { type NewTabLinkArray } from '../../../lib/components/opens-in-new-tab-link';
import {
  HdlCholesterolCategory,
  OverallCholesterolCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared';

export class CholesterolHigh extends CholesterolBase {
  public getPageContent(): JSX.Element {
    const highTitle = 'High risk';
    const veryHighTitle = 'Very high risk';

    const title =
      this.cholesterolParams.cholesterolScore.overallCategory ===
      OverallCholesterolCategory.High
        ? highTitle
        : veryHighTitle;

    const resources: NewTabLinkArray[] = [
      {
        id: 1,
        resource: {
          linkHref:
            'https://www.nhs.uk/conditions/high-cholesterol/cholesterol-levels/',
          linkText: 'High cholesterol levels - NHS UK'
        }
      },
      {
        id: 2,
        resource: {
          linkHref:
            'https://www.heartuk.org.uk/cholesterol/understanding-your-cholesterol-test-results-',
          linkText: 'Understanding your cholesterol results - Heart UK'
        }
      },
      {
        id: 3,
        resource: {
          linkHref: 'https://www.heartuk.org.uk/fh/what-is-fh',
          linkText: 'What is genetic high cholesterol? - Heart UK'
        }
      },
      {
        id: 4,
        resource: {
          linkHref:
            'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eat-less-saturated-fat/',
          linkText: 'How to eat less saturated fat - NHS UK'
        }
      },
      {
        id: 5,
        resource: {
          linkHref:
            'https://www.bhf.org.uk/informationsupport/heart-matters-magazine/nutrition/cholesterol-lowering-foods',
          linkText: '5 cholesterol-lowering foods - British Heart Foundation'
        }
      },
      {
        id: 6,
        resource: {
          linkHref:
            'https://www.bhf.org.uk/informationsupport/support/reducing-your-high-cholesterol',
          linkText:
            'Tips to reduce your high cholesterol levels - British Heart Foundation'
        }
      }
    ];

    return (
      <>
        {this.getTitleCard(title)}
        {this.getSpeakToGpIf()}
        {this.getTotalCholesterolCard(
          this.cholesterolParams.cholesterolScore.totalCholesterol!
        )}
        {this.getGoodHDLCholesterolCard(
          this.cholesterolParams.cholesterolScore.hdlCholesterol!
        )}
        {this.getTotalHDLCholesterolCard(
          this.cholesterolParams.cholesterolScore.totalCholesterolHdlRatio!
        )}

        {this.getWhatYourCholesterolMeans(
          this.cholesterolParams.cholesterolScore.totalCholesterolCategory!,
          this.cholesterolParams.cholesterolScore.hdlCholesterolCategory!,
          this.cholesterolParams.cholesterolScore
            .totalCholesterolHdlRatioCategory!
        )}
        {this.getHowToImproveYourLevels()}
        {this.getUsefulResources(resources, false)}
      </>
    );
  }

  getHowToImproveYourLevels(): JSX.Element {
    return (
      <>
        <h2>How to improve your levels</h2>
        <p>Your GP can help you manage your cholesterol.</p>
        <p>
          While some causes of cholesterol like genetics are out of your
          control, a healthy diet and lifestyle will always help to improve your
          levels.
        </p>

        {this.getDosAndDontsComponent()}
      </>
    );
  }

  getSpeakToGpIf(): JSX.Element {
    return (
      <Card cardType="urgent">
        <Card.Heading>Speak to a GP if:</Card.Heading>
        <Card.Content>
          <ul>
            <li>
              you have not already discussed your cholesterol levels with them
            </li>
            <li>
              you have a family history of high cholesterol, as it may be due to
              an inherited condition called familial hypercholesterolaemia
            </li>
          </ul>
        </Card.Content>
      </Card>
    );
  }

  getWhatYourCholesterolMeans(
    totalCholesterol: TotalCholesterolCategory,
    hdlCholesterol: HdlCholesterolCategory,
    ratioCategory: TotalCholesterolHdlRatioCategory
  ): JSX.Element {
    const isTotalCholesterolVeryHigh =
      totalCholesterol === TotalCholesterolCategory.VeryHigh ||
      totalCholesterol === TotalCholesterolCategory.High;
    const isgoodCholesterolLow = hdlCholesterol === HdlCholesterolCategory.Low;
    const isRatioHigh = ratioCategory === TotalCholesterolHdlRatioCategory.High;
    if ((isTotalCholesterolVeryHigh && isgoodCholesterolLow) || isRatioHigh) {
      return (
        <>
          <h2>What your cholesterol levels mean</h2>
          <p>
            Your total cholesterol level is high. This increases your risk of a
            heart attack or stroke.
          </p>
          <p>
            You have too much bad cholesterol which blocks your arteries, and
            not enough good cholesterol to clear it out.
          </p>
        </>
      );
    } else if (
      isTotalCholesterolVeryHigh &&
      !isgoodCholesterolLow &&
      !isRatioHigh
    ) {
      return (
        <>
          <h2>What your cholesterol levels mean</h2>
          <p>Your total cholesterol level is high.</p>
          <p>
            You have too much bad cholesterol and fats in your blood, which can
            block your arteries.
          </p>
          <p>This increases your risk of a heart attack or stroke.</p>
        </>
      );
    } else {
      return <></>;
    }
  }
}
