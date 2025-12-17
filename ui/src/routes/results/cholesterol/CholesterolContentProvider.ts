import { type NewTabLinkArray } from '../../../lib/components/opens-in-new-tab-link';
import {
  HdlCholesterolCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
  Sex
} from '@dnhc-health-checks/shared';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';

export interface CholesterolCardContent {
  totalCholesterolComment: string;
  totalCholesterolDescriptions: string[];
  totalCholesterolLink?: NewTabLinkArray[];
  totalCholesterolSidebarColor: RiskLevelColor;

  hdlCholesterolComment: string;
  hdlCholesterolDescriptions: string[];
  hdlCholesterolCardLink?: NewTabLinkArray[];
  hdlCholesterolSidebarColor: RiskLevelColor;

  totalHdlCholesterolComments: string;
  totalHdlCholesterolDescriptions: string[];
  totalHdlCholesterolSidebarColor: RiskLevelColor;
}

export class CholesterolContentProvider {
  private readonly MALE_HDL_BOUNDARY = 1.0;
  private readonly FEMALE_HDL_BOUNDARY = 1.2;

  getContent(
    totalCategory: TotalCholesterolCategory,
    hdlCholesterolCategory: HdlCholesterolCategory,
    totalCholesterolHdlRatio: TotalCholesterolHdlRatioCategory,
    sex: Sex,
    partialOverride: boolean = false
  ): CholesterolCardContent {
    const totalCholesterolComment = partialOverride
      ? this.totalCholesterolCardCommentsOverride[totalCategory]
      : this.totalCholesterolCardComments[totalCategory];
    const totalCholesterolDescriptions = partialOverride
      ? this.totalCholesterolCardDescriptionOverride(totalCategory)
      : this.totalCholesterolCardDescription;
    const hdlCholesterolComment = partialOverride
      ? this.hdlCholesterolCardCommentsOverride(sex, hdlCholesterolCategory)
      : this.hdlCholesterolCardComments[hdlCholesterolCategory];
    const hdlCholesterolDescriptions = partialOverride
      ? this.hdlCholesterolCardDescriptionOverride(hdlCholesterolCategory)
      : this.hdlCholesterolCardDescription(sex);

    return {
      totalCholesterolComment,
      totalCholesterolDescriptions,
      totalCholesterolLink: partialOverride
        ? this.totalCholesterolCardResources
        : undefined,
      totalCholesterolSidebarColor: this.getSidebarColor(
        totalCategory === TotalCholesterolCategory.Normal
      ),

      hdlCholesterolComment,
      hdlCholesterolDescriptions,
      hdlCholesterolCardLink: partialOverride
        ? this.hdlCholesterolCardResources
        : undefined,
      hdlCholesterolSidebarColor: this.getSidebarColor(
        hdlCholesterolCategory === HdlCholesterolCategory.Normal
      ),

      totalHdlCholesterolComments:
        this.totalHdlCholesterolCardComments[totalCholesterolHdlRatio],
      totalHdlCholesterolDescriptions: this.totalHdlCholesterolCardDescription,
      totalHdlCholesterolSidebarColor: this.getSidebarColor(
        totalCholesterolHdlRatio === TotalCholesterolHdlRatioCategory.Normal
      )
    };
  }

  private boundaryValueByGender(sex: Sex) {
    return sex === Sex.Male ? this.MALE_HDL_BOUNDARY : this.FEMALE_HDL_BOUNDARY;
  }

  // TOTAL CHOLESTEROL

  private readonly totalCholesterolCardComments = {
    [TotalCholesterolCategory.Normal]: 'This is in the normal range',
    [TotalCholesterolCategory.High]: 'This is high',
    [TotalCholesterolCategory.VeryHigh]: 'This is very high'
  };

  private readonly totalCholesterolCardCommentsOverride = {
    [TotalCholesterolCategory.Normal]:
      'This is in the healthy range (below 5mmol/L)',
    [TotalCholesterolCategory.High]:
      'This is high. A total cholesterol level below 5mmol/L is considered healthy',
    [TotalCholesterolCategory.VeryHigh]:
      'This is very high. A total cholesterol level below 5mmol/L is considered healthy'
  };

  private readonly totalCholesterolCardDescription = [
    'A total cholesterol score of 5mmol/L or below is considered healthy.'
  ];

  private totalCholesterolCardDescriptionOverride(
    category: TotalCholesterolCategory
  ): string[] {
    const descriptions = [
      ...(category !== TotalCholesterolCategory.Normal
        ? ['This does suggest a potential risk to your heart health.']
        : []),
      'Total cholesterol tells us how much cholesterol is in your blood.',
      'It does not tell us if your bad cholesterol is too high or your good cholesterol is too low.',
      'The right balance is key to reduce the risk of heart disease and stroke.',
      'More testing is needed for a clearer picture.'
    ];
    return descriptions;
  }

  private readonly totalCholesterolCardResources = [
    {
      id: 1,
      resource: {
        linkHref: 'https://www.heartuk.org.uk/cholesterol/overview',
        linkText: 'Understanding your cholesterol - Heart UK (opens in new tab)'
      }
    }
  ];

  // HDL

  private readonly hdlCholesterolCardComments = {
    [HdlCholesterolCategory.Low]: 'This is too low',
    [HdlCholesterolCategory.Normal]: 'This is in the normal range'
  };

  private hdlCholesterolCardCommentsOverride(
    sex: Sex,
    category: HdlCholesterolCategory
  ) {
    const map = {
      [HdlCholesterolCategory.Low]: `This is too low (below ${this.boundaryValueByGender(sex)}mmol/L)`,
      [HdlCholesterolCategory.Normal]: `This is in the healthy range (above ${this.boundaryValueByGender(sex)}mmol/L)`
    };

    return map[category];
  }

  private hdlCholesterolCardDescription(sex: Sex) {
    return [
      `A level above ${this.boundaryValueByGender(sex)}mmol/L is considered healthy.`
    ];
  }

  private hdlCholesterolCardDescriptionOverride(
    category: HdlCholesterolCategory
  ): string[] {
    const descriptions = [
      'Good cholesterol (HDL) helps remove bad cholesterol (LDL) and other fats from your body.',
      ...(category === HdlCholesterolCategory.Low
        ? [
            'A low level of good cholesterol may mean your body is not clearing bad cholesterol effectively. This can increase your risk of heart disease or stroke.'
          ]
        : []),
      ...(category === HdlCholesterolCategory.Normal
        ? [
            'Even with a healthy level of good cholesterol, you can still have a high level of bad cholesterol.'
          ]
        : []),
      'More testing is needed for a clearer picture.'
    ];

    return descriptions;
  }

  private readonly hdlCholesterolCardResources = [
    {
      id: 1,
      resource: {
        linkHref: 'https://www.heartuk.org.uk/cholesterol/hdl-cholesterol',
        linkText:
          'Find out more about good cholesterol on the Heart UK website (opens in new tab)'
      }
    }
  ];

  // HDL-CHOLESTEROL RATIO

  private readonly totalHdlCholesterolCardComments = {
    [TotalCholesterolHdlRatioCategory.Normal]: 'This is in the normal range',
    [TotalCholesterolHdlRatioCategory.High]: 'This is high risk'
  };

  private readonly totalHdlCholesterolCardDescription = [
    'A ratio higher than 6 is high risk. The lower the score the better.'
  ];

  private getSidebarColor(isNormal: boolean): RiskLevelColor {
    return isNormal ? RiskLevelColor.GreenThick : RiskLevelColor.RedThick;
  }
}
