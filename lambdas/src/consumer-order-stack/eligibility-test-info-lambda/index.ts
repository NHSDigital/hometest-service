import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import { createFhirErrorResponse, createFhirResponse } from '../../lib/fhir-response'
import {Bundle, BundleEntry} from "fhir/r4";
import {init} from "./init";
import {validatePostcodeFormat} from "./postcode-validator";

const name = 'eligibility-test-info-lambda';

const {supplierDb: supplierService, /*laLookupService,*/ commons} = init()

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const postcode = event.queryStringParameters?.postcode;
  const testCode = event.queryStringParameters?.test_code || '31676001'; // HIV Default? why is this optional?

  if (!postcode) {
    commons.logError(name, 'Postcode parameter is required');
    return createFhirErrorResponse(400, 'invalid', 'Postcode parameter is required')
  }

  const formatResult = validatePostcodeFormat(postcode);

  if (!formatResult.valid) {
    return createFhirErrorResponse(400, 'invalid', 'Invalid postcode format');
  }

  const formattedPostcode = formatResult.cleaned

  try {
    // const la = await laLookupService.lookupByPostcode(formattedPostcode)
    const la = {
      localAuthorityCode: 'E09000001',
    }

    if (!la) {
      commons.logError(name, `No local authority found for ${formattedPostcode}`);
      return createFhirErrorResponse(404, 'not-found', `No local authority found for ${formattedPostcode}`);
    }

    const offerings = await supplierService.getSuppliersByLocalAuthorityAndTest(la.localAuthorityCode, testCode);

    if (offerings.length === 0) {
      commons.logError(name, `No suppliers found for ${formattedPostcode}`);
      return createFhirErrorResponse(404, 'not-found', `No suppliers found for ${formattedPostcode}`);
    }

    const { suppliers, locations } = offerings.reduce(
      (acc, o) => {
        acc.suppliers.push({
          fullUrl: `urn:uuid:${o.organization.id}`,
          resource: o.organization,
          search: { mode: 'match' as const }
        });

        acc.locations.push({
          fullUrl: `urn:uuid:${o.location.id}`,
          resource: o.location,
          search: { mode: 'include' as const }
        });

        return acc;
      },
      { suppliers: [] as BundleEntry[], locations: [] as BundleEntry[] }
    );


    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: offerings.length,
      entry: [...suppliers, ...locations]
    };

    return createFhirResponse(200, bundle);

  } catch (error) {
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }
};
