import {
  type SummaryItem,
  SummaryRows
} from '../../../lib/components/summary-row';
import {
  EthnicBackground,
  EthnicBackgroundOther,
  Lupus,
  SevereMentalIllness,
  AntipsychoticMedication,
  Migraines,
  Impotence,
  SteroidTablets,
  RheumatoidArthritis,
  type IAboutYou
} from '@dnhc-health-checks/shared';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AboutYouSummaryRowsProps {
  aboutYouAnswers: IAboutYou;
}

export default function AboutYouSummaryRows({
  aboutYouAnswers
}: Readonly<AboutYouSummaryRowsProps>) {
  function getChangeLink(step: string): string {
    return getStepUrl(RoutePath.AboutYouJourney, step);
  }

  const descriptiveBackground =
    aboutYouAnswers.ethnicBackground === EthnicBackground.Other
      ? ''
      : `${EnumDescriptions.EthnicBackground[aboutYouAnswers.ethnicBackground!]} `;

  const getDetailedEthnicGroupDescription = (): string => {
    if (
      aboutYouAnswers.detailedEthnicGroup ===
      EthnicBackgroundOther.PreferNotToSay
    ) {
      return EnumDescriptions.OtherDetailedEthnicGroup[
        EthnicBackgroundOther.PreferNotToSay
      ];
    }
    const detailedEthnicGroupDescriptions =
      EnumDescriptions.DetailedEthnicGroup[aboutYouAnswers.ethnicBackground!];
    return (
      detailedEthnicGroupDescriptions[
        aboutYouAnswers.detailedEthnicGroup! as keyof typeof detailedEthnicGroupDescriptions
      ] ?? ''
    );
  };

  const items: SummaryItem[] = [
    {
      id: 'address-postcode',
      key: 'Enter your postcode',
      value: aboutYouAnswers.postcode ?? '',
      changeLink: getChangeLink(JourneyStepNames.TownsendPostcodePage),
      screenReaderSuffix: 'postcode'
    },
    {
      id: 'parent-sibling-heart-attack',
      key: 'Have any of your parents or siblings had a heart attack or angina before the age of 60?',
      value:
        EnumDescriptions.ParentSiblingHeartAttack[
          aboutYouAnswers.hasFamilyHeartAttackHistory!
        ],
      changeLink: getChangeLink(JourneyStepNames.ParentSiblingHeartAttackPage),
      screenReaderSuffix:
        '- have any of your parents or siblings had a heart attack before the age of 60?'
    },
    {
      id: 'parent-sibling-child-diabetes',
      key: 'Do you have a parent, sibling or child with diabetes?',
      value:
        EnumDescriptions.ParentSiblingChildDiabetes[
          aboutYouAnswers.hasFamilyDiabetesHistory!
        ],
      changeLink: getChangeLink(
        JourneyStepNames.ParentSiblingChildDiabetesPage
      ),
      screenReaderSuffix:
        '- do you have a parent, sibling or child with diabetes?'
    },
    {
      id: 'sex-assigned-at-birth',
      key: 'What is your sex assigned at birth?',
      value: EnumDescriptions.Sex[aboutYouAnswers.sex!],
      changeLink: getChangeLink(JourneyStepNames.SexAssignedAtBirthPage),
      screenReaderSuffix: 'sex assigned at birth'
    },
    {
      id: 'ethnicity',
      key: 'What is your ethnic group?',
      value:
        EnumDescriptions.EthnicBackground[aboutYouAnswers.ethnicBackground!],
      changeLink: getChangeLink(JourneyStepNames.EthnicGroupPage),
      screenReaderSuffix: 'ethnic group'
    },
    {
      id: 'detailed-ethnicity',
      key: `Which of the following describes your ${descriptiveBackground} group?`,
      value: getDetailedEthnicGroupDescription(),
      changeLink: getChangeLink(JourneyStepNames.DescribeEthnicBackgroundPage),
      screenReaderSuffix: '- which of the following describes your group?'
    },
    {
      id: 'smoking',
      key: 'Do you smoke?',
      value: EnumDescriptions.Smoking[aboutYouAnswers.smoking!].description,
      changeLink: getChangeLink(JourneyStepNames.SmokingQuestionPage),
      screenReaderSuffix: '- do you smoke?'
    },
    {
      id: 'lupus',
      key: 'Has a healthcare professional ever diagnosed you with lupus?',
      value: aboutYouAnswers.lupus ? Lupus.Yes : Lupus.No,
      changeLink: getChangeLink(JourneyStepNames.LupusPage),
      screenReaderSuffix:
        '- has a healthcare professional ever diagnosed you with lupus?'
    },
    {
      id: 'severe-mental-health',
      key: 'Has a healthcare professional ever diagnosed you with a severe mental health condition?',
      value: aboutYouAnswers.severeMentalIllness
        ? SevereMentalIllness.Yes
        : SevereMentalIllness.No,
      changeLink: getChangeLink(JourneyStepNames.SevereMentalIllness),
      screenReaderSuffix:
        '- has a healthcare professional ever diagnosed you with a severe mental health condition?'
    },
    {
      id: 'antipsychotic-medication',
      key: 'Are you currently taking one of the listed medicines for a severe mental health condition?',
      value: aboutYouAnswers.atypicalAntipsychoticMedication
        ? AntipsychoticMedication.Yes
        : AntipsychoticMedication.No,
      changeLink: getChangeLink(
        JourneyStepNames.AtypicalAntipsychoticMedication
      ),
      screenReaderSuffix:
        '- are you currently taking one of the listed medicines for a severe mental health condition?'
    },
    {
      id: 'migraines',
      key: 'Has a healthcare professional ever diagnosed you with migraines?',
      value: aboutYouAnswers.migraines ? Migraines.Yes : Migraines.No,
      changeLink: getChangeLink(JourneyStepNames.Migraines),
      screenReaderSuffix:
        '- has a healthcare professional ever diagnosed you with migraines?'
    },
    ...((aboutYouAnswers.sex as 'Male') === 'Male'
      ? [
          {
            id: 'erectile-dysfunction',
            key: 'Has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?',
            value: aboutYouAnswers.impotence ? Impotence.Yes : Impotence.No,
            changeLink: getChangeLink(JourneyStepNames.ErectileDysfunction),
            screenReaderSuffix:
              '- has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?'
          }
        ]
      : []),

    {
      id: 'steroid-tablets',
      key: 'Do you regularly take corticosteroid tablets?',
      value: aboutYouAnswers.steroidTablets
        ? SteroidTablets.Yes
        : SteroidTablets.No,
      changeLink: getChangeLink(JourneyStepNames.SteroidTablets),
      screenReaderSuffix: '- do you regularly take corticosteroid tablets?'
    },
    {
      id: 'rheumatoid-arthritis',
      key: 'Has a healthcare professional ever diagnosed you with rheumatoid arthritis?',
      value: aboutYouAnswers.rheumatoidArthritis
        ? RheumatoidArthritis.Yes
        : RheumatoidArthritis.No,
      changeLink: getChangeLink(JourneyStepNames.RheumatoidArthritis),
      screenReaderSuffix:
        '- has a healthcare professional ever diagnosed you with rheumatoid arthritis?'
    }
  ];

  return <SummaryRows items={items} />;
}
