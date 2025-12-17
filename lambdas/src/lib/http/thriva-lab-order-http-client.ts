import { type HttpClient } from './http-client';
import { type IPatientData } from '../models/patient/patient';
import {
  LabTestType,
  type ILabOrder
} from '@dnhc-health-checks/shared/model/lab-order';
import { Service } from '../service';
import { type Commons } from '../commons';
import {
  ThrivaLabTestType,
  ThrivaSex,
  type ThrivaLabOrderRequestModel
} from '../models/lab-orders/thriva/thriva-lab-order-request-model';
import { type ThrivaLabOrderResponseModel } from '../models/lab-orders/thriva/thriva-lab-order-response-model';
import { type HealthCheckDetails } from '../models/lab-orders/health-check-details';
import { Sex } from '@dnhc-health-checks/shared';

export const JSON_API_CONTENT_TYPE = 'application/vnd.api+json';
export const THRIVA_FIRST_NAME_MAX_LENGTH = 19;
export const THRIVA_LAST_NAME_MAX_LENGTH = 20;
export const THRIVA_NAME_MAX_LENGTH = 40;

export class ThrivaLabOrderHttpClient extends Service {
  readonly httpClient: HttpClient;
  private readonly apiUrl: string;

  constructor(commons: Commons, httpClient: HttpClient, apiUrl: string) {
    super(commons, 'ThrivaLabOrderHttpClient');
    this.httpClient = httpClient;
    this.apiUrl = apiUrl;
  }

  thrivaTestTypesMap: { [key in LabTestType]: ThrivaLabTestType } = {
    [LabTestType.Cholesterol]: ThrivaLabTestType.Cholesterol,
    [LabTestType.HbA1c]: ThrivaLabTestType.Hba1c
  };

  thrivaSexMap: { [key in Sex]: ThrivaSex } = {
    [Sex.Female]: ThrivaSex.Female,
    [Sex.Male]: ThrivaSex.Male
  };

  async placeOrder(
    patient: IPatientData,
    labOrder: ILabOrder,
    healthCheckDetails: HealthCheckDetails,
    authToken: string
  ): Promise<string> {
    try {
      this.logger.info('About to place lab order with Thriva', {
        labOrderId: labOrder.id
      });
      const headers = {
        authorization: `Bearer ${authToken}`,
        'Content-Type': JSON_API_CONTENT_TYPE,
        Accept: JSON_API_CONTENT_TYPE
      };

      const body: ThrivaLabOrderRequestModel = this.mapToLabOrderRequestModel(
        patient,
        labOrder,
        healthCheckDetails
      );
      this.logger.debug('Request to thriva', { request: body });
      const response = await this.httpClient.postRequest<
        ThrivaLabOrderRequestModel,
        ThrivaLabOrderResponseModel
      >(`${this.apiUrl}/dhc/orders`, body, headers);
      this.logger.debug('Response from thriva', { response });
      return response.data.id;
    } catch (error) {
      this.logger.error('Encountered error while sending request');
      throw error;
    }
  }

  mapToLabOrderRequestModel(
    patient: IPatientData,
    labOrder: ILabOrder,
    healthCheckDetails: HealthCheckDetails
  ): ThrivaLabOrderRequestModel {
    const inputModel: ThrivaLabOrderRequestModel = {
      data: {
        type: 'order',
        attributes: {
          order_external_reference: labOrder.id,
          test: {
            test_profiles: labOrder.testTypes.map(
              (testType) => this.thrivaTestTypesMap[testType]
            )
          },
          delivery_address: {
            name: this.formatPatientName(patient),
            line1: labOrder.deliveryAddress.addressLine1,
            line2: labOrder.deliveryAddress.addressLine2,
            line3: labOrder.deliveryAddress.addressLine3,
            city: labOrder.deliveryAddress.townCity,
            postcode: labOrder.deliveryAddress.postcode,
            country: 'GB'
          },
          user: {
            contact: {
              first_name: patient.firstName,
              last_name: patient.lastName,
              email: patient.email
            },
            date_of_birth: patient.dateOfBirth,
            sex: this.thrivaSexMap[healthCheckDetails.sex],
            user_external_reference: patient.patientId
          }
        }
      }
    };

    if (labOrder.phoneNumber) {
      inputModel.data.attributes.user.contact.mobile_phone_number =
        this.formatPhoneNumber(labOrder.phoneNumber);
    }
    return inputModel;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    return '+44' + phoneNumber.slice(1);
  }

  private formatPatientName(patient: IPatientData): string {
    let firstName = patient.firstName.trim();
    if (patient.firstName.length > THRIVA_FIRST_NAME_MAX_LENGTH) {
      firstName = firstName.slice(0, THRIVA_FIRST_NAME_MAX_LENGTH);
      this.logger.info('Patient first name was truncated', {
        nameLength: patient.firstName.length
      });
    }

    let lastName = patient.lastName.trim();
    if (patient.lastName.length > THRIVA_LAST_NAME_MAX_LENGTH) {
      lastName = lastName.slice(0, THRIVA_LAST_NAME_MAX_LENGTH);
      this.logger.info('Patient last name was truncated', {
        nameLength: patient.lastName.length
      });
    }

    return `${firstName} ${lastName}`;
  }
}
