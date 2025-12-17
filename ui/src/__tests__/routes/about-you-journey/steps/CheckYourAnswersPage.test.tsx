/* eslint-disable jest/no-conditional-expect */
import { fireEvent, render, screen } from '@testing-library/react';
import CheckYourAnswersPage from '../../../../routes/about-you-journey/steps/CheckYourAnswersPage';
import {
  type IAboutYou,
  Sex,
  Smoking,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../../../lib/components/event-audit-button');

describe('CheckYourAnswersPage tests', () => {
  let aboutYou = {} as IAboutYou;
  let submitHealthCheckAnswers: jest.Mock;
  const healthCheck: IHealthCheck = {
    id: '123456',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  beforeEach(() => {
    aboutYou = {
      ethnicBackground: 'White',
      detailedEthnicGroup: 'Irish',
      smoking: Smoking.Quitted,
      sex: 'Male',
      hasFamilyHeartAttackHistory: 'No',
      hasFamilyDiabetesHistory: 'No',
      lupus: false,
      severeMentalIllness: false,
      atypicalAntipsychoticMedication: false,
      migraines: false,
      impotence: false,
      steroidTablets: false,
      rheumatoidArthritis: false
    } as IAboutYou;
    submitHealthCheckAnswers = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('When the "Save and Continue" button is clicked then should save the answers and emit an audit event', () => {
    render(
      <BrowserRouter>
        <CheckYourAnswersPage
          healthCheck={healthCheck}
          patientId={patientId}
          healthCheckAnswers={aboutYou}
          submitAnswers={submitHealthCheckAnswers}
        />
      </BrowserRouter>
    );

    const element = screen.getByText('Save and continue');
    fireEvent.click(element);

    expect(submitHealthCheckAnswers).toHaveBeenCalled();
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.SectionCompleteAboutYou,
            healthCheck,
            patientId
          }
        ])
      )
    ).toBeInTheDocument();
  });

  test.each([Sex.Female, Sex.Male])(
    'Display erectile dysfunction only when Male - test %s',
    (sex) => {
      aboutYou.sex = sex;

      render(
        <BrowserRouter>
          <CheckYourAnswersPage
            healthCheck={healthCheck}
            patientId={patientId}
            healthCheckAnswers={aboutYou}
            submitAnswers={submitHealthCheckAnswers}
          />
        </BrowserRouter>
      );

      const impotence = screen.queryByText(
        'Has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?'
      );

      Sex.Female === sex
        ? expect(impotence).not.toBeInTheDocument()
        : expect(impotence).toBeInTheDocument();
    }
  );
});
