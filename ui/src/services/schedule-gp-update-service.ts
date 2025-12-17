import { backendApiEndpoint } from '../settings';
import { httpClient } from '../lib/http/http-client';
import { HttpCallStatus } from './health-check-service';

export enum GpUpdateReason {
  highBP = 'highBP',
  urgentHighBP = 'urgentHighBP',
  urgentLowBP = 'urgentLowBP',
  expiryQuestionnaire = 'expiryQuestionnaire',
  bloodResultOutstanding = 'bloodResultOutstanding',
  auditScore = 'auditScore'
}

export interface IScheduleGpUpdateService {
  createGpUpdateSchedule: (
    healthCheckId: string,
    scheduleReason: GpUpdateReason
  ) => Promise<HttpCallStatus>;
}

const scheduleGpUpdateService: IScheduleGpUpdateService = {
  createGpUpdateSchedule: async function (
    healthCheckId: string,
    scheduleReason: GpUpdateReason
  ): Promise<HttpCallStatus> {
    try {
      await httpClient.postRequest(
        `${backendApiEndpoint}/hometest/${healthCheckId}/schedule-gp-update`,
        { scheduleReason }
      );
      return HttpCallStatus.Successful;
    } catch (error: unknown) {
      throw error;
    }
  }
};

export default scheduleGpUpdateService;
