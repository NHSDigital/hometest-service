import { Card, DoAndDontList, InsetText } from 'nhsuk-react-components';
import {
  type ICholesterolScore,
  type Sex,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { type RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import {
  type NewTabLinkArray,
  OpenedFrom,
  OpensInNewTabLinkArray
} from '../../../lib/components/opens-in-new-tab-link';
import {
  type CholesterolCardContent,
  CholesterolContentProvider
} from './CholesterolContentProvider';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';

interface CholesterolBaseProps {
  getPageContent(): JSX.Element;
  getTitleCard(cholesterolCategory: string): JSX.Element;
  getBaseScoreCard: (
    cardDetails: CholesterolCard,
    dataTestId: string
  ) => JSX.Element;
  getUnknownScoreCard: (
    dataTestId: string,
    title: string,
    label: string
  ) => JSX.Element;
  getTotalCholesterolCard(value: number, category: string): JSX.Element;
  getGoodHDLCholesterolCard(
    value: number,
    category: string,
    sex: Sex,
    partialOverride: boolean
  ): JSX.Element;
  getTotalHDLCholesterolCard(value: number, category: string): JSX.Element;
  getDosAndDontsComponent(): JSX.Element;
  getUsefulResources(
    resources: NewTabLinkArray[],
    includeNewTabMessageToAllTabs: boolean
  ): JSX.Element;
}

export interface CholesterolCard {
  levelSideBar: RiskLevelColor;
  title: string;
  value: number;
  units?: string;
  commentOnValue: string;
  descriptions: string[];
  link?: NewTabLinkArray[];
}

export interface CholesterolParams {
  sex: Sex;
  cholesterolScore: ICholesterolScore;
}

export abstract class CholesterolBase implements CholesterolBaseProps {
  constructor(
    protected cholesterolParams: CholesterolParams,
    partialOverride: boolean = false
  ) {
    this.cholesterolContent = new CholesterolContentProvider().getContent(
      cholesterolParams.cholesterolScore.totalCholesterolCategory!,
      cholesterolParams.cholesterolScore.hdlCholesterolCategory!,
      cholesterolParams.cholesterolScore.totalCholesterolHdlRatioCategory!,
      cholesterolParams.sex,
      partialOverride
    );
  }
  private readonly healthCheck = useHealthCheck();
  private readonly cholesterolContent: CholesterolCardContent;

  abstract getPageContent(): JSX.Element;

  getOpensInNewTabLinkArray(
    resources: NewTabLinkArray[],
    includeNewTabMessageToAllTabs: boolean
  ) {
    return OpensInNewTabLinkArray(resources, includeNewTabMessageToAllTabs, {
      eventType: AuditEventType.ExternalResourceOpened,
      openedFrom: OpenedFrom.ResultsCholesterol,
      healthCheck: this.healthCheck.data
    });
  }

  getUsefulResources(
    resources: NewTabLinkArray[],
    includeNewTabMessageToAllTabs: boolean
  ): JSX.Element {
    return (
      <>
        <h2>Useful resources</h2>
        <p>The following links open in a new tab.</p>
        {this.getOpensInNewTabLinkArray(
          resources,
          includeNewTabMessageToAllTabs
        )}
      </>
    );
  }

  public getTitleCard(cholesterolCategory: string): JSX.Element {
    return (
      <Card>
        <Card.Content>
          <Card.Heading
            aria-label={`Your cholesterol levels are: ${cholesterolCategory}`}
          >
            Your cholesterol levels are:{' '}
            <span
              className="nhsuk-heading-l nhsuk-u-margin-top-3 nhsuk-u-margin-bottom-0"
              aria-hidden="true"
            >
              {cholesterolCategory}
            </span>
          </Card.Heading>
        </Card.Content>
      </Card>
    );
  }

  getDosAndDontsComponent(): JSX.Element {
    return (
      <DoAndDontList listType="do">
        <DoAndDontList.Item>
          eat plenty of fruit and vegetables, high fibre carbohydrates and cut
          down on salt
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          limit bad fats in your diet, like butter, cream and fried food
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          aim for 150 minutes of moderate intensity activity a week, such as
          brisk walking or cycling
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          try to quit smoking if you smoke
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          cut back on alcohol if you drink
        </DoAndDontList.Item>
      </DoAndDontList>
    );
  }

  getBaseScoreCard(
    cardDetails: CholesterolCard,
    dataTestId: string
  ): JSX.Element {
    return (
      <Card data-testid={dataTestId}>
        <Card.Content>
          <InsetText
            className={cardDetails.levelSideBar + '  nhsuk-u-margin-bottom-5'}
          >
            <p className="nhsuk-u-font-weight-bold">{cardDetails.title}</p>
            <p className="nhsuk-u-font-weight-bold">{`${cardDetails.value}${cardDetails.units}`}</p>
            <p>{`${cardDetails.commentOnValue}.`}</p>
          </InsetText>

          {cardDetails.descriptions.map((desc) => (
            <p key={desc}>{desc}</p>
          ))}
          {cardDetails.link
            ? this.getOpensInNewTabLinkArray(cardDetails.link, false)
            : ''}
        </Card.Content>
      </Card>
    );
  }

  getUnknownScoreCard(
    dataTestId: string,
    title: string,
    label: string
  ): JSX.Element {
    return (
      <Card data-testid={dataTestId}>
        <Card.Content>
          <InsetText className={'app-card__heading-inset--grey'}>
            <p className="nhsuk-u-font-weight-bold" id={label}>
              {title}
            </p>
            <p className="nhsuk-u-font-weight-bold" aria-labelledby={label}>
              Not known
            </p>
          </InsetText>
        </Card.Content>
      </Card>
    );
  }

  getTotalCholesterolCard(value: number): JSX.Element {
    const cardConfig: CholesterolCard = {
      levelSideBar: this.cholesterolContent.totalCholesterolSidebarColor,
      title: 'Your total cholesterol is:',
      value: value,
      units: 'mmol/L',
      commentOnValue: this.cholesterolContent.totalCholesterolComment,
      descriptions: this.cholesterolContent.totalCholesterolDescriptions,
      link: this.cholesterolContent.totalCholesterolLink
    };

    return this.getBaseScoreCard(cardConfig, 'total-cholesterol-card');
  }

  getGoodHDLCholesterolCard(value: number): JSX.Element {
    const card: CholesterolCard = {
      levelSideBar: this.cholesterolContent.hdlCholesterolSidebarColor,
      title: 'Your level of good cholesterol (called HDL) is:',
      value: value,
      units: 'mmol/L',
      commentOnValue: this.cholesterolContent.hdlCholesterolComment,
      descriptions: this.cholesterolContent.hdlCholesterolDescriptions,
      link: this.cholesterolContent.hdlCholesterolCardLink
    };

    return this.getBaseScoreCard(card, 'goodl-hdl-cholesterol-card');
  }

  getTotalHDLCholesterolCard(value: number): JSX.Element {
    const card: CholesterolCard = {
      levelSideBar: this.cholesterolContent.totalHdlCholesterolSidebarColor,
      title: 'Your total cholesterol to HDL ratio is:',
      value: value,
      units: '',
      commentOnValue: this.cholesterolContent.totalHdlCholesterolComments,
      descriptions: this.cholesterolContent.totalHdlCholesterolDescriptions
    };
    return this.getBaseScoreCard(card, 'total-hdl-cholesterol-card');
  }
}
