import { type BloodTestOrder } from '../lib/apiClients/HealthCheckModel';

export const bloodOrderAdressTestData: BloodTestOrder = {
  address: {
    addressLine1: '123 Main St',
    addressLine2: 'Apt 1',
    addressLine3: 'Suite 100',
    townCity: 'London',
    postcode: 'E1 7AX'
  },
  isBloodTestSectionSubmitted: true
};
