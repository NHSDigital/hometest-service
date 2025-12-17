import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  BloodPressureLocation,
  ConfirmLowBloodPressureSymptoms,
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import ConfirmBloodPressurePage from '../../../../routes/blood-pressure-journey/steps/ConfirmBloodPressurePage';
import { BrowserRouter } from 'react-router-dom';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

jest.mock('../../../../lib/components/event-audit-button');

describe('ConfirmBloodPressurePage tests', () => {
  const healthCheckAnswers: any = {
    bloodPressureSystolic: 89,
    bloodPressureDiastolic: 59,
    bloodPressureLocation: BloodPressureLocation.Monitor,
    hasStrongLowBloodPressureSymptoms: false
  } as IBloodPressure;
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  const submitAnswers = jest.fn();

  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <ConfirmBloodPressurePage
          healthCheckAnswers={healthCheckAnswers}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    // Assert
    expect(
      screen.getByText('How did you take your blood pressure reading?')
    ).toBeInTheDocument();
    const locationDisplayedText =
      EnumDescriptions.BloodPressureLocation[
        healthCheckAnswers.bloodPressureLocation as BloodPressureLocation
      ];
    expect(screen.getByText(locationDisplayedText)).toBeInTheDocument();
    expect(screen.getByText('Enter your reading')).toBeInTheDocument();
    expect(
      screen.getByText(`${healthCheckAnswers.bloodPressureSystolic} Systolic`, {
        exact: false
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${healthCheckAnswers.bloodPressureDiastolic} Diastolic`,
        { exact: false }
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Do you have symptoms of fainting or dizziness?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(ConfirmLowBloodPressureSymptoms.Negative)
    ).toBeInTheDocument();
    expect(screen.getByText('Check your answers')).toBeInTheDocument();
  });

  it('should submit answers on Save and continue button click', async () => {
    // arrange
    render(
      <BrowserRouter>
        <ConfirmBloodPressurePage
          healthCheckAnswers={healthCheckAnswers}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getByText('Save and continue');

    // act
    await userEvent.click(element);

    // assert
    expect(submitAnswers).toHaveBeenCalled();
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.SectionCompleteBloodPressure,
            healthCheck,
            patientId,
            details: { bpTakenAt: healthCheckAnswers.bloodPressureLocation }
          }
        ])
      )
    ).toBeInTheDocument();
  });

  it('should redirect to Blood Pressure Check Page on clicking first Change button', async () => {
    // arrange
    render(
      <BrowserRouter>
        <ConfirmBloodPressurePage
          healthCheckAnswers={healthCheckAnswers}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getAllByText('Change')[0];

    // act
    await userEvent.click(element);

    // assert
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.SectionCompleteBloodPressure,
            healthCheck,
            patientId,
            details: { bpTakenAt: healthCheckAnswers.bloodPressureLocation }
          }
        ])
      )
    ).toBeInTheDocument();
  });

  it('should redirect to Enter Blood Pressure Page on clicking second Change button', async () => {
    // arrange
    render(
      <BrowserRouter>
        <ConfirmBloodPressurePage
          healthCheckAnswers={healthCheckAnswers}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getAllByText('Change')[1];

    // act
    await userEvent.click(element);

    // assert
    const redirectPageHeading = await screen.findByText('Enter your reading');
    expect(redirectPageHeading).toBeInTheDocument();
  });

  it('should redirect to low blood pressure symptoms Page on clicking third Change button', async () => {
    // arrange
    render(
      <BrowserRouter>
        <ConfirmBloodPressurePage
          healthCheckAnswers={healthCheckAnswers}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getAllByText('Change')[2];

    // act
    await userEvent.click(element);

    // assert
    const redirectPageHeading = await screen.findByText(
      'Do you have symptoms of fainting or dizziness?'
    );
    expect(redirectPageHeading).toBeInTheDocument();
  });

  it('renders the component without low blood pressure symptom when user has no low blood prressure', () => {
    const highBloodPressure = {
      ...healthCheckAnswers,
      bloodPressureSystolic: 160,
      bloodPressureDiastolic: 58
    };

    render(
      <BrowserRouter>
        <ConfirmBloodPressurePage
          healthCheckAnswers={highBloodPressure}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    // Assert
    expect(
      screen.getByText('How did you take your blood pressure reading?')
    ).toBeInTheDocument();
    const locationDisplayedText =
      EnumDescriptions.BloodPressureLocation[
        healthCheckAnswers.bloodPressureLocation as BloodPressureLocation
      ];
    expect(screen.getByText(locationDisplayedText)).toBeInTheDocument();
    expect(screen.getByText('Enter your reading')).toBeInTheDocument();
    expect(
      screen.getByText(`${highBloodPressure.bloodPressureSystolic} Systolic`, {
        exact: false
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${highBloodPressure.bloodPressureDiastolic} Diastolic`,
        { exact: false }
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Do you have symptoms of fainting or dizziness?')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Check your answers')).toBeInTheDocument();
  });
});
