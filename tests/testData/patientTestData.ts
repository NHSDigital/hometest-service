import { type PatientItem } from '../lib/aws/dynamoDB/DbPatientService';
import { v4 as uuidv4 } from 'uuid';

export const TermsAndConditionsLatestVersion = '1.0';

export function getPatientDbItem(
  patientNhsNumber: string,
  patientId: string = uuidv4(),
  odsCode: string = 'mock_enabled_code',
  TcVersion: string = TermsAndConditionsLatestVersion
): PatientItem {
  return {
    nhsNumber: patientNhsNumber,
    acceptedTermsVersion: TcVersion,
    dateOfBirth: '1979-07-29',
    gpOdsCode: odsCode,
    nhsLoginId: 'mock-sub',
    patientId
  };
}

export const patientIdForThrivaIntegration: string =
  '4dfe84a3-8e5f-4f93-a213-0a9a1b999eca';
export const patientOdsCodeForThrivaIntegration: string = 'A28579';

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  return (
    today.getFullYear() -
    birthDate.getFullYear() -
    (today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
      ? 1
      : 0)
  );
}

export function getRandomNhsNumber(): string {
  return `${Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000}`;
}
