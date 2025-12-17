import { CholesterolBase } from './CholesterolBase';
import { type NewTabLinkArray } from '../../../lib/components/opens-in-new-tab-link';

export class CholesterolNormal extends CholesterolBase {
  public getPageContent(): JSX.Element {
    const resources: NewTabLinkArray[] = [
      {
        id: 1,
        resource: {
          linkHref:
            'https://www.heartuk.org.uk/cholesterol/understanding-your-cholesterol-test-results-',
          linkText: 'Understanding your cholesterol results - Heart UK'
        }
      },
      {
        id: 2,
        resource: {
          linkHref:
            'https://www.nhs.uk/conditions/high-cholesterol/how-to-lower-your-cholesterol/',
          linkText: 'How to lower your cholesterol - NHS'
        }
      }
    ];

    return (
      <>
        {this.getTitleCard('Healthy')}
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
        {this.getHowToMaintainYourLevels()}
        {this.getUsefulResources(resources, false)}
      </>
    );
  }

  getWhatYourCholesterolMeans(): JSX.Element {
    return (
      <>
        <h2>What your cholesterol levels mean</h2>
        <p>
          Your cholesterol levels are within the healthy range, which lowers
          your risk of a heart attack or stroke.
        </p>
      </>
    );
  }

  getHowToMaintainYourLevels(): JSX.Element {
    return (
      <>
        <h2>How to maintain your levels</h2>
        <p>
          To keep your cholesterol levels healthy, focus on a balanced diet,
          regular exercise and avoid smoking.
        </p>

        {this.getDosAndDontsComponent()}
      </>
    );
  }
}
