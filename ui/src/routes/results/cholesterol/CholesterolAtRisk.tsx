import { CholesterolBase } from './CholesterolBase';
import { type NewTabLinkArray } from '../../../lib/components/opens-in-new-tab-link';

export class CholesterolAtRisk extends CholesterolBase {
  public getPageContent(): JSX.Element {
    const resources: NewTabLinkArray[] = [
      {
        id: 1,
        resource: {
          linkHref:
            'https://www.heartuk.org.uk/genetic-conditions/low-hdl-cholesterol-',
          linkText: 'Low HDL cholesterol levels - Heart UK'
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
          linkHref:
            'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eat-less-saturated-fat/',
          linkText: 'How to eat less saturated fat - NHS UK'
        }
      },
      {
        id: 4,
        resource: {
          linkHref:
            'https://www.bhf.org.uk/informationsupport/heart-matters-magazine/nutrition/cholesterol-lowering-foods',
          linkText: '5 cholesterol-lowering foods - British Heart Foundation'
        }
      },
      {
        id: 5,
        resource: {
          linkHref:
            'https://www.bhf.org.uk/informationsupport/support/reducing-your-high-cholesterol',
          linkText:
            'Tips to reduce your cholesterol levels - British Heart Foundation'
        }
      }
    ];

    return (
      <>
        {this.getTitleCard('At risk')}
        {this.getTotalCholesterolCard(
          this.cholesterolParams.cholesterolScore.totalCholesterol!
        )}
        {this.getGoodHDLCholesterolCard(
          this.cholesterolParams.cholesterolScore.hdlCholesterol!
        )}
        {this.getTotalHDLCholesterolCard(
          this.cholesterolParams.cholesterolScore.totalCholesterolHdlRatio!
        )}

        {this.getWhatYourCholesterolMeans()}
        {this.getHowToImproveYourLevels()}
        {this.getUsefulResources(resources, false)}
      </>
    );
  }
  getWhatYourCholesterolMeans(): JSX.Element {
    return (
      <>
        <h2>What your cholesterol levels mean</h2>
        <p>
          Your total cholesterol level is normal but your good cholesterol (HDL)
          is too low. This increases your risk of a heart attack or stroke.
        </p>

        <p>
          Good cholesterol (HDL) removes excess cholesterol from your blood,
          preventing blocked arteries and protecting against heart disease.
        </p>
      </>
    );
  }

  getHowToImproveYourLevels(): JSX.Element {
    return (
      <>
        <h2>How to improve your levels</h2>
        <p>
          To improve your good cholesterol levels, cut down on unhealthy fats,
          eat more heart-healthy foods and exercise regularly.
        </p>

        {this.getDosAndDontsComponent()}
      </>
    );
  }
}
