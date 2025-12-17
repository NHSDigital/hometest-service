import { type IAboutYou, Sex } from '@dnhc-health-checks/shared';
import { JourneyStepNames } from '../../lib/models/route-paths';
import { StepManager, DestinationActionCheck } from '../StepManager';

export const create = (healthCheckAnswers: IAboutYou): StepManager => {
  const stepManager = new StepManager(JourneyStepNames.TownsendPostcodePage);

  stepManager.addStep(JourneyStepNames.TownsendPostcodePage, [
    new DestinationActionCheck(JourneyStepNames.ParentSiblingHeartAttackPage)
  ]);

  stepManager.addStep(JourneyStepNames.ParentSiblingHeartAttackPage, [
    new DestinationActionCheck(JourneyStepNames.ParentSiblingChildDiabetesPage)
  ]);

  stepManager.addStep(JourneyStepNames.ParentSiblingChildDiabetesPage, [
    new DestinationActionCheck(JourneyStepNames.SexAssignedAtBirthPage)
  ]);

  stepManager.addStep(JourneyStepNames.SexAssignedAtBirthPage, [
    new DestinationActionCheck(JourneyStepNames.EthnicGroupPage)
  ]);

  stepManager.addStep(JourneyStepNames.EthnicGroupPage, [
    new DestinationActionCheck(JourneyStepNames.DescribeEthnicBackgroundPage)
  ]);

  stepManager.addStep(JourneyStepNames.DescribeEthnicBackgroundPage, [
    new DestinationActionCheck(JourneyStepNames.SmokingQuestionPage)
  ]);

  stepManager.addStep(JourneyStepNames.SmokingQuestionPage, [
    new DestinationActionCheck(JourneyStepNames.LupusPage)
  ]);

  stepManager.addStep(JourneyStepNames.LupusPage, [
    new DestinationActionCheck(JourneyStepNames.SevereMentalIllness)
  ]);

  stepManager.addStep(JourneyStepNames.SevereMentalIllness, [
    new DestinationActionCheck(JourneyStepNames.AtypicalAntipsychoticMedication)
  ]);

  stepManager.addStep(JourneyStepNames.AtypicalAntipsychoticMedication, [
    new DestinationActionCheck(JourneyStepNames.Migraines)
  ]);

  stepManager.addStep(JourneyStepNames.Migraines, [
    new DestinationActionCheck(
      JourneyStepNames.ErectileDysfunction,
      () => healthCheckAnswers.sex === Sex.Male
    ),
    new DestinationActionCheck(
      JourneyStepNames.SteroidTablets,
      () => healthCheckAnswers.sex === Sex.Female
    )
  ]);

  stepManager.addStep(JourneyStepNames.ErectileDysfunction, [
    new DestinationActionCheck(JourneyStepNames.SteroidTablets)
  ]);

  stepManager.addStep(JourneyStepNames.SteroidTablets, [
    new DestinationActionCheck(JourneyStepNames.RheumatoidArthritis)
  ]);

  stepManager.addStep(JourneyStepNames.RheumatoidArthritis, [
    new DestinationActionCheck(JourneyStepNames.CheckYourAnswersAboutYouPage)
  ]);

  return stepManager;
};
