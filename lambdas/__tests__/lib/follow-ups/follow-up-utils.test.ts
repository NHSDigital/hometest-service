import type { FollowUpReason } from '../../../src/lib/communications/gp-notification-init-service';
import {
  getFollowUpCodesForEmis,
  getFollowUpReasonsForEmail
} from '../../../src/lib/follow-ups/follow-up-utils';
import {
  FollowUpType,
  type HealthCheckFollowUpDetails
} from '../../../src/lib/follow-ups/health-check-follow-up-service';

describe('follow up utils tests', () => {
  describe('getFollowUpReasonsForEmail', () => {
    it('Returns empty array when input is empty', () => {
      expect(getFollowUpReasonsForEmail([])).toEqual([]);
    });

    it('Filters out items with undefined followUpReasonText', () => {
      const details: HealthCheckFollowUpDetails[] = [
        {
          followUpReasonText: undefined,
          followUpType: FollowUpType.Routine,
          snomedCodes: ['abc']
        },
        {
          followUpReasonText: 'Important Reason',
          followUpType: FollowUpType.Routine,
          snomedCodes: ['def']
        }
      ];
      const result: FollowUpReason[] = getFollowUpReasonsForEmail(details);
      expect(result).toEqual([
        {
          reason: 'Important Reason',
          type: FollowUpType.Routine
        }
      ]);
    });

    it('Sorts urgent before routine and sorts alphabetically by reason', () => {
      const details: HealthCheckFollowUpDetails[] = [
        {
          followUpReasonText: 'Reason A',
          followUpType: FollowUpType.Routine,
          snomedCodes: ['A']
        },
        {
          followUpReasonText: 'Reason B',
          followUpType: FollowUpType.Urgent,
          snomedCodes: ['B']
        },
        {
          followUpReasonText: 'Reason C',
          followUpType: FollowUpType.Urgent,
          snomedCodes: ['C']
        },
        {
          followUpReasonText: 'Reason D',
          followUpType: FollowUpType.Routine,
          snomedCodes: ['D']
        }
      ];
      const result = getFollowUpReasonsForEmail(details);
      expect(result).toEqual([
        { reason: 'Reason B', type: FollowUpType.Urgent },
        { reason: 'Reason C', type: FollowUpType.Urgent },
        { reason: 'Reason A', type: FollowUpType.Routine },
        { reason: 'Reason D', type: FollowUpType.Routine }
      ]);
    });
  });

  describe('getFollowUpCodesForEmis', () => {
    it('Returns empty array when input is empty', () => {
      expect(getFollowUpCodesForEmis([], FollowUpType.Routine)).toEqual([]);
    });

    it('Returns codes only for specified followUpType', () => {
      const details: HealthCheckFollowUpDetails[] = [
        {
          followUpReasonText: 'Reason 1',
          followUpType: FollowUpType.Routine,
          snomedCodes: ['code1', 'code2']
        },
        {
          followUpReasonText: 'Reason 2',
          followUpType: FollowUpType.Urgent,
          snomedCodes: ['code3']
        }
      ];

      expect(getFollowUpCodesForEmis(details, FollowUpType.Routine)).toEqual([
        'code1',
        'code2'
      ]);
      expect(getFollowUpCodesForEmis(details, FollowUpType.Urgent)).toEqual([
        'code3'
      ]);
    });

    it('Flattens snomedCodes arrays for matching type', () => {
      const details: HealthCheckFollowUpDetails[] = [
        {
          followUpReasonText: 'Reason 1',
          followUpType: FollowUpType.Routine,
          snomedCodes: ['code1', 'code2']
        },
        {
          followUpReasonText: 'Reason 2',
          followUpType: FollowUpType.Routine,
          snomedCodes: ['code3']
        },
        {
          followUpReasonText: 'Reason 3',
          followUpType: FollowUpType.Urgent,
          snomedCodes: ['code4']
        }
      ];

      expect(getFollowUpCodesForEmis(details, FollowUpType.Routine)).toEqual([
        'code1',
        'code2',
        'code3'
      ]);
      expect(getFollowUpCodesForEmis(details, FollowUpType.Urgent)).toEqual([
        'code4'
      ]);
    });
  });
});
