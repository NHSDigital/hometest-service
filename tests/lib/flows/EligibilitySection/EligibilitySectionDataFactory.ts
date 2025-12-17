import { HaveYouCompletedOptions } from '../../../page-objects/EligibilityPages/HaveYouCompletedNhsHealthCheckPage';
import { PreExistingOptions } from '../../../page-objects/EligibilityPages/PreExistingHealthConditionsPage';
import { NeedToLeaveTheOnlineServiceOptions } from '../../../page-objects/EligibilityPages/WhoShouldNotUseThisOnlineServicePage';
import { CompleteNhsHealthCheckOptions } from '../../../page-objects/DeclarationPages/ReadDeclarationPage';
import { ReceivedInvitationOptions } from '../../../page-objects/EligibilityPages/ReceivedInvitationQueryPage';

export interface EligibilitySectionFlowData {
  receivedInvitation?: ReceivedInvitationOptions;
  haveYouCompleted?: HaveYouCompletedOptions;
  preExistingHealthConditions?: PreExistingOptions;
  needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions;
  completeNhsHealthCheck?: CompleteNhsHealthCheckOptions;
  userInvitedViaLink?: boolean;
}

export enum EligibilitySectionDataType {
  ELIGIBLE_USER = 'ELIGIBLE_USER',
  ELIGIBLE_USER_WITH_INVITATION = 'ELIGIBLE_USER_WITH_INVITATION',
  NOT_ELIGIBLE_PRE_CONDITIONS_USER = 'NOT_ELIGIBLE_PRE_CONDITIONS_USER',
  NOT_ELIGIBLE_CANNOT_CONTINUE_ONLINE_USER = 'NOT_ELIGIBLE_CANNOT_CONTINUE_ONLINE_USER',
  NOT_ELIGIBLE_TESTED_LESS_THAN_5_YEARS_USER = 'NOT_ELIGIBLE_TESTED_LESS_THAN_5_YEARS_USER',
  ELIGIBLE_USER_COMING_FROM_INVITE_LINK = 'ELIGIBLE_USER_COMING_FROM_INVITE_LINK'
}

export class EligibilitySectionDataFactory {
  readonly dataType: EligibilitySectionDataType;

  constructor(dataType: EligibilitySectionDataType) {
    this.dataType = dataType;
  }

  public getData(): EligibilitySectionFlowData {
    switch (this.dataType) {
      case EligibilitySectionDataType.ELIGIBLE_USER:
        return {
          receivedInvitation: ReceivedInvitationOptions.NO,
          haveYouCompleted: HaveYouCompletedOptions.NO,
          preExistingHealthConditions: PreExistingOptions.NO,
          needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions.NO,
          completeNhsHealthCheck: CompleteNhsHealthCheckOptions.YES
        };
      case EligibilitySectionDataType.ELIGIBLE_USER_WITH_INVITATION:
        return {
          receivedInvitation: ReceivedInvitationOptions.YES,
          needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions.NO,
          completeNhsHealthCheck: CompleteNhsHealthCheckOptions.YES
        };
      case EligibilitySectionDataType.NOT_ELIGIBLE_PRE_CONDITIONS_USER:
        return {
          receivedInvitation: ReceivedInvitationOptions.NO,
          haveYouCompleted: HaveYouCompletedOptions.NO,
          preExistingHealthConditions: PreExistingOptions.YES,
          needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions.NO,
          completeNhsHealthCheck: CompleteNhsHealthCheckOptions.YES
        };
      case EligibilitySectionDataType.NOT_ELIGIBLE_CANNOT_CONTINUE_ONLINE_USER:
        return {
          receivedInvitation: ReceivedInvitationOptions.NO,
          haveYouCompleted: HaveYouCompletedOptions.NO,
          preExistingHealthConditions: PreExistingOptions.NO,
          needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions.YES,
          completeNhsHealthCheck: CompleteNhsHealthCheckOptions.YES
        };
      case EligibilitySectionDataType.NOT_ELIGIBLE_TESTED_LESS_THAN_5_YEARS_USER:
        return {
          receivedInvitation: ReceivedInvitationOptions.NO,
          haveYouCompleted: HaveYouCompletedOptions.YES,
          preExistingHealthConditions: PreExistingOptions.NO,
          needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions.YES,
          completeNhsHealthCheck: CompleteNhsHealthCheckOptions.YES
        };
      case EligibilitySectionDataType.ELIGIBLE_USER_COMING_FROM_INVITE_LINK:
        return {
          needToLeaveTheOnlineService: NeedToLeaveTheOnlineServiceOptions.NO,
          userInvitedViaLink: true
        };
      default:
        throw new Error('Unknown strategy type:');
    }
  }
}
