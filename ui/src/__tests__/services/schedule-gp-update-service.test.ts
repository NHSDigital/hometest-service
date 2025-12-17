import { httpClient } from '../../lib/http/http-client';
import { HttpCallStatus } from '../../services/health-check-service';
import scheduleGpUpdateService, {
  GpUpdateReason
} from '../../services/schedule-gp-update-service';

describe('scheduleGpUpdateService', () => {
  const postRequestSpy = jest.spyOn(httpClient, 'postRequest');
  const healthCheckId = '1234';
  const scheduleReason = GpUpdateReason.auditScore;

  beforeEach(() => {
    postRequestSpy.mockResolvedValue({ scheduleId: '1234567' });
  });

  afterEach(() => {
    postRequestSpy.mockReset();
  });

  describe('createGpUpdateSchedule', () => {
    it('calls appropriate endpoint with correct data', async () => {
      const response = await scheduleGpUpdateService.createGpUpdateSchedule(
        healthCheckId,
        scheduleReason
      );
      expect(postRequestSpy).toHaveBeenCalledTimes(1);
      expect(postRequestSpy).toHaveBeenCalledWith(
        `${process.env.REACT_APP_HTC_BACKEND_API_ENDPOINT}/hometest/${healthCheckId}/schedule-gp-update`,
        { scheduleReason }
      );
      expect(response).toEqual(HttpCallStatus.Successful);
    });
  });
});
