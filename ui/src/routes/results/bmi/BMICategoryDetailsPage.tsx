import { type RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { Card, InsetText, Details } from 'nhsuk-react-components';
import {
  EthnicBackground,
  BmiClassification
} from '@dnhc-health-checks/shared';
import { BmiChartFigure } from 'nhsuk-tools-chart-components-react';
import { BmiClassificationBounds } from '../../../lib/models/bmi-classification-bounds';
import { ImportantCallout } from '../../../lib/components/important-callout';

export interface BMIDetails {
  riskLevelColor: RiskLevelColor;
  getGPSection: () => JSX.Element;
  getBenefitsSection: () => JSX.Element;
  getUseFulResources(): JSX.Element;
  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element;
}

export abstract class BMICategoryDetailsPage implements BMIDetails {
  abstract readonly riskLevelColor: RiskLevelColor;
  abstract getGPSection(): JSX.Element;
  abstract getBenefitsSection(): JSX.Element;
  abstract getUseFulResources(): JSX.Element;
  abstract getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element;

  public getCardDetailingBMI(
    bmi: number,
    ethnicBackground: EthnicBackground,
    riskDescription: string
  ): JSX.Element {
    const classificationBounds =
      BmiClassificationBounds.getClassificationBounds(ethnicBackground);
    const showChart = this.showBMIGraph(bmi, ethnicBackground);

    return (
      <Card>
        <Card.Content>
          <Card.Heading aria-label={`Your BMI is: ${bmi}`}>
            Your BMI is:
          </Card.Heading>
          <span className="app-card__heading-big-number" aria-hidden="true">
            {bmi}
          </span>
          <InsetText
            className={
              this.riskLevelColor +
              ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
            }
          >
            <p>{riskDescription}</p>
          </InsetText>
          {showChart && (
            <BmiChartFigure
              ariaLabel="Your body mass index result is shown on a chart here. A full description can be found in the text below it."
              classificationBounds={classificationBounds}
              bmi={bmi}
              legendMarkerText="Your reading"
              legendKeys={{
                underweight: BmiClassification.Underweight,
                healthy: BmiClassification.Healthy,
                overweight: BmiClassification.Overweight,
                obese: 'Obese'
              }}
            />
          )}
          {this.renderScoreDetails(ethnicBackground)}
        </Card.Content>
      </Card>
    );
  }

  getImportantNote(text: string): JSX.Element {
    return (
      <ImportantCallout>
        <p>{text}</p>
      </ImportantCallout>
    );
  }

  private showBMIGraph(bmi: number, ethnicBackground: EthnicBackground) {
    const GRAPH_OBESE_THRESHOLD_FOR_WHITE_AND_OTHER_ETHNIC_BACKGROUND = 39.9;
    const GRAPH_OBESE_THRESHOLD_DEFAULT = 37.4;

    if (this.isWhiteOrOtherEthnic(ethnicBackground)) {
      return bmi <= GRAPH_OBESE_THRESHOLD_FOR_WHITE_AND_OTHER_ETHNIC_BACKGROUND;
    } else {
      return bmi <= GRAPH_OBESE_THRESHOLD_DEFAULT;
    }
  }

  private isWhiteOrOtherEthnic(ethnicBackground: EthnicBackground) {
    return (
      ethnicBackground === EthnicBackground.White ||
      ethnicBackground === EthnicBackground.Other
    );
  }

  private renderScoreDetails(ethnicBackground: EthnicBackground) {
    const isWhiteOrOther = this.isWhiteOrOtherEthnic(ethnicBackground);

    const bmiExplanationToRender = isWhiteOrOther
      ? this.renderScoreDetailsWhiteOrOther()
      : this.renderScoreDetailsRestOfOptions();
    return (
      <Details>
        <Details.Summary>What BMI is and how it is calculated</Details.Summary>
        <Details.Text>
          <p>
            BMI is a way of finding out whether a person is a healthy weight for
            their height.
          </p>
          <p>
            Your BMI is calculated by dividing your weight in kilograms by your
            height in metres squared.
          </p>
          <p>The BMI categories are:</p>

          {bmiExplanationToRender}
          <p>
            BMI is just one measure of health. It cannot tell the difference
            between muscle and fat.
          </p>
          <p>
            For example, if you have a lot of muscle, you may be classed as
            overweight or obese despite having low body fat.
          </p>
        </Details.Text>
      </Details>
    );
  }

  private renderScoreDetailsWhiteOrOther() {
    return (
      <ul className="nhsuk-u-margin-top-4">
        <li>18.4 and below - underweight</li>
        <li>18.5 to 24.9 - healthy weight</li>
        <li>25 to 29.9 - overweight</li>
        <li>30 or more - obesity</li>
      </ul>
    );
  }

  private renderScoreDetailsRestOfOptions() {
    return (
      <ul className="nhsuk-u-margin-top-4">
        <li>18.4 and below - underweight</li>
        <li>18.5 to 22.9 - healthy weight</li>
        <li>23 to 27.4 - overweight</li>
        <li>27.5 or more - obesity</li>
      </ul>
    );
  }
}
