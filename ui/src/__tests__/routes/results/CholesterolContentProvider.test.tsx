import {
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
  Sex
} from '@dnhc-health-checks/shared';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { CholesterolContentProvider } from '../../../routes/results/cholesterol/CholesterolContentProvider';

describe('CholesterolContentProvider', () => {
  let provider: CholesterolContentProvider;

  beforeEach(() => {
    provider = new CholesterolContentProvider();
  });

  describe('totalCholesterolComment', () => {
    const cases: [TotalCholesterolCategory, boolean, string][] = [
      [TotalCholesterolCategory.Normal, false, 'This is in the normal range'],
      [TotalCholesterolCategory.High, false, 'This is high'],
      [TotalCholesterolCategory.VeryHigh, false, 'This is very high'],
      [
        TotalCholesterolCategory.Normal,
        true,
        'This is in the healthy range (below 5mmol/L)'
      ],
      [
        TotalCholesterolCategory.High,
        true,
        'This is high. A total cholesterol level below 5mmol/L is considered healthy'
      ],
      [
        TotalCholesterolCategory.VeryHigh,
        true,
        'This is very high. A total cholesterol level below 5mmol/L is considered healthy'
      ]
    ];

    test.each(cases)(
      'should return the correct comment for %s total cholesterol with partialOverride %s',
      (category, partialOverride, expected) => {
        const content = provider.getContent(
          category,
          HdlCholesterolCategory.Normal,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male,
          partialOverride
        );
        expect(content.totalCholesterolComment).toBe(expected);
      }
    );
  });

  describe('totalCholesterolDescriptions', () => {
    const cases: [TotalCholesterolCategory, boolean, string[]][] = [
      [
        TotalCholesterolCategory.Normal,
        false,
        ['A total cholesterol score of 5mmol/L or below is considered healthy.']
      ],
      [
        TotalCholesterolCategory.Normal,
        true,
        [
          'Total cholesterol tells us how much cholesterol is in your blood.',
          'It does not tell us if your bad cholesterol is too high or your good cholesterol is too low.',
          'The right balance is key to reduce the risk of heart disease and stroke.',
          'More testing is needed for a clearer picture.'
        ]
      ],
      [
        TotalCholesterolCategory.High,
        true,
        [
          'This does suggest a potential risk to your heart health.',
          'Total cholesterol tells us how much cholesterol is in your blood.',
          'It does not tell us if your bad cholesterol is too high or your good cholesterol is too low.',
          'The right balance is key to reduce the risk of heart disease and stroke.',
          'More testing is needed for a clearer picture.'
        ]
      ],
      [
        TotalCholesterolCategory.VeryHigh,
        true,
        [
          'This does suggest a potential risk to your heart health.',
          'Total cholesterol tells us how much cholesterol is in your blood.',
          'It does not tell us if your bad cholesterol is too high or your good cholesterol is too low.',
          'The right balance is key to reduce the risk of heart disease and stroke.',
          'More testing is needed for a clearer picture.'
        ]
      ]
    ];

    test.each(cases)(
      'should return the correct description for %s total cholesterol with partialOverride %s',
      (category, partialOverride, expected) => {
        const content = provider.getContent(
          category,
          HdlCholesterolCategory.Normal,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male,
          partialOverride
        );
        expect(content.totalCholesterolDescriptions).toEqual(expected);
      }
    );
  });

  describe('totalCholesterolLink', () => {
    const cases: [
      boolean,
      (
        | { id: number; resource: { linkHref: string; linkText: string } }[]
        | undefined
      )
    ][] = [
      [
        true,
        [
          {
            id: 1,
            resource: {
              linkHref: 'https://www.heartuk.org.uk/cholesterol/overview',
              linkText:
                'Understanding your cholesterol - Heart UK (opens in new tab)'
            }
          }
        ]
      ],
      [false, undefined]
    ];

    test.each(cases)(
      'should return the correct link for total cholesterol when partialOverride is %s',
      (partialOverride, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          HdlCholesterolCategory.Normal,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male,
          partialOverride
        );
        expect(content.totalCholesterolLink).toEqual(expected);
      }
    );
  });

  describe('totalCholesterolSidebarColor', () => {
    const cases: [TotalCholesterolCategory, RiskLevelColor][] = [
      [TotalCholesterolCategory.Normal, RiskLevelColor.GreenThick],
      [TotalCholesterolCategory.High, RiskLevelColor.RedThick],
      [TotalCholesterolCategory.VeryHigh, RiskLevelColor.RedThick]
    ];

    test.each(cases)(
      'should return the correct sidebar color for %s total cholesterol',
      (category, expected) => {
        const content = provider.getContent(
          category,
          HdlCholesterolCategory.Normal,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male
        );
        expect(content.totalCholesterolSidebarColor).toBe(expected);
      }
    );
  });

  describe('hdlCholesterolComment', () => {
    const cases: [HdlCholesterolCategory, boolean, string][] = [
      [HdlCholesterolCategory.Low, false, 'This is too low'],
      [HdlCholesterolCategory.Normal, false, 'This is in the normal range'],
      [HdlCholesterolCategory.Low, true, 'This is too low (below 1mmol/L)'],
      [
        HdlCholesterolCategory.Normal,
        true,
        'This is in the healthy range (above 1mmol/L)'
      ]
    ];

    test.each(cases)(
      'should return the correct comment for %s HDL cholesterol with partialOverride %s',
      (category, partialOverride, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          category,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male,
          partialOverride
        );
        expect(content.hdlCholesterolComment).toBe(expected);
      }
    );
  });

  describe('hdlCholesterolDescriptions', () => {
    const cases: [Sex, HdlCholesterolCategory, boolean, string[]][] = [
      [
        Sex.Male,
        HdlCholesterolCategory.Low,
        false,
        ['A level above 1mmol/L is considered healthy.']
      ],
      [
        Sex.Female,
        HdlCholesterolCategory.Normal,
        false,
        ['A level above 1.2mmol/L is considered healthy.']
      ],
      [
        Sex.Male,
        HdlCholesterolCategory.Low,
        true,
        [
          'Good cholesterol (HDL) helps remove bad cholesterol (LDL) and other fats from your body.',
          'A low level of good cholesterol may mean your body is not clearing bad cholesterol effectively. This can increase your risk of heart disease or stroke.',
          'More testing is needed for a clearer picture.'
        ]
      ],
      [
        Sex.Male,
        HdlCholesterolCategory.Normal,
        true,
        [
          'Good cholesterol (HDL) helps remove bad cholesterol (LDL) and other fats from your body.',
          'Even with a healthy level of good cholesterol, you can still have a high level of bad cholesterol.',
          'More testing is needed for a clearer picture.'
        ]
      ]
    ];

    test.each(cases)(
      'should return the correct description for %s HDL cholesterol with partialOverride %s',
      (sex, category, partialOverride, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          category,
          TotalCholesterolHdlRatioCategory.Normal,
          sex,
          partialOverride
        );
        expect(content.hdlCholesterolDescriptions).toEqual(expected);
      }
    );
  });

  describe('hdlCholesterolCardLink', () => {
    const cases: [
      boolean,
      (
        | { id: number; resource: { linkHref: string; linkText: string } }[]
        | undefined
      )
    ][] = [
      [
        true,
        [
          {
            id: 1,
            resource: {
              linkHref:
                'https://www.heartuk.org.uk/cholesterol/hdl-cholesterol',
              linkText:
                'Find out more about good cholesterol on the Heart UK website (opens in new tab)'
            }
          }
        ]
      ],
      [false, undefined]
    ];

    test.each(cases)(
      'should return the correct link for HDL cholesterol when partialOverride is %s',
      (partialOverride, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          HdlCholesterolCategory.Normal,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male,
          partialOverride
        );
        expect(content.hdlCholesterolCardLink).toEqual(expected);
      }
    );
  });

  describe('hdlCholesterolSidebarColor', () => {
    const cases: [HdlCholesterolCategory, RiskLevelColor][] = [
      [HdlCholesterolCategory.Normal, RiskLevelColor.GreenThick],
      [HdlCholesterolCategory.Low, RiskLevelColor.RedThick]
    ];

    test.each(cases)(
      'should return the correct sidebar color for %s HDL cholesterol',
      (category, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          category,
          TotalCholesterolHdlRatioCategory.Normal,
          Sex.Male
        );
        expect(content.hdlCholesterolSidebarColor).toBe(expected);
      }
    );
  });

  describe('totalHdlCholesterolComments', () => {
    const cases: [TotalCholesterolHdlRatioCategory, string][] = [
      [TotalCholesterolHdlRatioCategory.Normal, 'This is in the normal range'],
      [TotalCholesterolHdlRatioCategory.High, 'This is high risk']
    ];

    test.each(cases)(
      'should return the correct comment for %s total HDL cholesterol ratio',
      (category, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          HdlCholesterolCategory.Normal,
          category,
          Sex.Male
        );
        expect(content.totalHdlCholesterolComments).toBe(expected);
      }
    );
  });

  describe('totalHdlCholesterolDescriptions', () => {
    const cases: [TotalCholesterolHdlRatioCategory, string[]][] = [
      [
        TotalCholesterolHdlRatioCategory.Normal,
        ['A ratio higher than 6 is high risk. The lower the score the better.']
      ]
    ];

    test.each(cases)(
      'should return the correct description for %s total HDL cholesterol ratio',
      (category, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          HdlCholesterolCategory.Normal,
          category,
          Sex.Male
        );
        expect(content.totalHdlCholesterolDescriptions).toEqual(expected);
      }
    );
  });

  describe('totalHdlCholesterolSidebarColor', () => {
    const cases: [TotalCholesterolHdlRatioCategory, RiskLevelColor][] = [
      [TotalCholesterolHdlRatioCategory.Normal, RiskLevelColor.GreenThick],
      [TotalCholesterolHdlRatioCategory.High, RiskLevelColor.RedThick]
    ];

    test.each(cases)(
      'should return the correct sidebar color for %s total HDL cholesterol ratio',
      (category, expected) => {
        const content = provider.getContent(
          TotalCholesterolCategory.Normal,
          HdlCholesterolCategory.Normal,
          category,
          Sex.Male
        );
        expect(content.totalHdlCholesterolSidebarColor).toBe(expected);
      }
    );
  });
});
