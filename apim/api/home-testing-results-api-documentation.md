<div class="nhsd-m-emphasis-box nhsd-m-emphasis-box--emphasis nhsd-!t-margin-bottom-6" aria-label="Highlighted Information">
    <div class="nhsd-a-box nhsd-a-box--border-blue">
        <div class="nhsd-m-emphasis-box__image-box">
            <figure class="nhsd-a-image">
                <picture class="nhsd-a-image__picture">
                    <img src="http://digital.nhs.uk/binaries/content/gallery/icons/info.svg?colour=231f20" alt="" style="object-fit:fill">
                </picture>
            </figure>
        </div>
        <div class="nhsd-m-emphasis-box__content-box">
            <div data-uipath="website.contentblock.emphasis.content" class="nhsd-t-word-break">
                <p class="nhsd-t-body">This API is <a href="https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses">in development</a>, meaning it is being actively developed and is not yet available for production use.
            </div>
        </div>
    </div>
</div>

![Digital NHS Health Check API overview diagram](https://digital.nhs.uk/binaries/content/gallery/website/developer/api-catalogue/home-testing/apim-onboarding-health-check-high-level-diagram.png)

## Overview

Use this API to submit laboratory test results from blood biomarker analysis back to the Digital NHS Health Checks service.

This API enables approved medical laboratory providers to send patient biometric test results, including cholesterol and HbA1c measurements, directly into the Digital NHS Health Checks service. Results submitted through this API are stored securely and made available to patients through their account in the Digital NHS Health Check service.

The API is designed for contracted laboratory partners who process blood test samples for the NHS Health Checks programme.

What you can use this API for

- Submit blood test results for:
  - cholesterol (total cholesterol, HDL cholesterol, cholesterol/HDL ratio)
    - diabetes (HbA1c) biomarkers
    - submit partial results when only some biomarkers were successfully measured (for example, if one test failed but others succeeded)
    - report blood test failures with detailed reason codes for individual biomarkers or entire tests

What you cannot use this API for

- place new test orders - the NHS Health Checks service places orders by calling the laboratory's ordering endpoint
- retrieve previously submitted results - results are stored in the Digital NHS Health Checks service and accessed by patients through their account
- update or delete submitted results

Supported test types

The API currently accepts results for the following test types:

1. **Cholesterol profile**
2. **Diabetes screening**

The results for the following biomarkers can be sent via the API:

| Biomarker Code | Description                                | Units    | Test Type           | Notes                                  |
| -------------- | ------------------------------------------ | -------- | ------------------- | -------------------------------------- |
| **CHO**        | Total Cholesterol                          | mmol/L   | Cholesterol profile |                                        |
| **HDL**        | HDL Cholesterol (High-Density Lipoprotein) | mmol/L   | Cholesterol profile |
| **CHDD**       | Total Cholesterol/HDL Ratio                | ratio    | Cholesterol profile | Calculated value                       |
| **GHBI**       | HbA1c (Glycated Hemoglobin)                | mmol/mol | Diabetes screening  | Ordered when Leicester Risk Score ≥ 15 |

The API accepts the following results:

- complete results where all biomarker values are provided for both cholesterol and diabetes tests
- complete results where all biomarker values are provided for cholesterol (no diabetes test was needed)
- partial results where user has done both cholesterol and diabetes tests, and only one of the test biomarkers are provided while the other test failed
- partial cholesterol results with only some biomarkers provided
- complete failure of both tests

In case of failure of any of the biomarkers the failure reason should be provided instead of the value.

## Who can use this API

This API is restricted to **approved medical laboratory providers** with an NHS England contract to process blood test samples for the NHS Digital Health Checks programme.

To use this API, you must complete the onboarding process (see ‘Onboarding’ section below).

## Related APIs

The following APIs are related to this API:

- [Patient Data Manager FHIR API](https://digital.nhs.uk/developer/api-catalogue/patient-data-manager) - Stores, retrieves, and manages patient healthcare data in a standard, interoperable format. It provides a FHIR-compliant repository for direct care data, ensuring real-time access, data security, and consistency across NHS services.
- EMIS Health IM1 Transactions Interface - Updates patient GP records for GPs using the EMIS Web client.

## API status and roadmap

The API is currently live and operational outside of the APIM platform. Migration to NHS API Management Platform is in progress.

## Service level

Service level details are currently being finalised and will be updated here once confirmed.

For more details, see [service levels](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#service-levels).

## Technology

This API is [RESTful](https://digital.nhs.uk/developer/guides-and-documentation/api-technologies-at-nhs-digital#basic-rest-apis).

It conforms to RESTful API standards and best practices:

- uses standard HTTP methods (POST for submitting results)
- uses standard HTTP status codes to indicate success or failure
- accepts and returns data in JSON format

For more details, see [API technologies at NHS Digital](https://digital.nhs.uk/developer/guides-and-documentation/our-api-technologies#basic-rest).

## Network access

This API is available on the internet and accessible via HTTPS.

For more details see [Network access for APIs](https://digital.nhs.uk/developer/guides-and-documentation/network-access-for-apis).

## Security and authorisation

This API is application-restricted, meaning we authenticate the calling application but not the indiviual end user.

To use this API, use the following security pattern:

- [Application-restricted RESTful API - signed JWT authentication](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication)

## Errors

We use standard HTTP status codes to show whether an API request succeeded or not.

Your API-calling application should have a mechanism to automatically try again. See APIM [reference guide](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#error-handling) for more information about error handling.

### Status Codes

| Status Code | Meaning                | Description                                            |
| ----------- | ---------------------- | ------------------------------------------------------ |
| **201**     | Created                | Results successfully received and stored               |
| **400**     | Bad Request            | Invalid request format or data validation failed       |
| **401**     | Unauthorized           | Authentication failed - invalid or missing credentials |
| **403**     | Forbidden              | Valid credentials but insufficient permissions         |
| **413**     | Payload Too Large      | Request body exceeds 1 MB limit                        |
| **415**     | Unsupported Media Type | Content-Type must be `application/json`                |
| **429**     | Too Many Requests      | Rate limit exceeded - retry after backoff period       |
| **500**     | Internal Server Error  | Unexpected error on our server                         |

#### Error Response Format

All error responses follow a consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description"
}
```

## Environments and testing

The following environments will be available for testing:

| Environment     | Base URL                                          |
| --------------- | ------------------------------------------------- |
| **Sandbox**     | `https://sandbox.api.service.nhs.uk/home-testing` |
| **Integration** | `https://int.api.service.nhs.uk/home-testing`     |

### Sandbox testing

Our sandbox environment:

- is for early developer testing
- only covers a limited set of scenarios
- is stateless, so does not actually persist any updates
- is open access, so does not allow you to test authorisation

For details of sandbox test scenarios, or to try out sandbox using our 'Try this API' feature, see the documentation.

Alternatively, you can try out the sandbox using our Postman collection:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/39603482-d8dbe37d-f913-43f9-ba2c-969549673c07)

### Integration testing

Our integration test environment:

- is for formal integration testing
- is stateful, so persists updates
- includes authorisation via [signed JWT authentication](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication)

You can try out our integration environment using our Postman collection. This Postman collection contains a signed JWT authentication script, allowing you to test our integration environment without writing any code:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/39603482-c25be5b8-97ba-492c-a46d-89af95ab7402)

## Onboarding

You need to get your software approved by us before it can go live with this API. We call this onboarding. The onboarding process can sometimes be quite long, so it's worth planning well ahead.

**Requirements for onboarding:**

- Valid contract with NHS England for laboratory services in the Digital Health Checks programme
- Technical capability to receive test orders from the NHS Health Checks service
- Demonstrated ability to handle patient data securely and in compliance with NHS data standards
- Completed integration testing in non-production environments

**What you need to provide:**

- Details of your laboratory's ordering endpoint
- Evidence of successful integration testing
- Data protection and information governance documentation

To understand how our online digital onboarding process works, see [digital onboarding](https://digital.nhs.uk/developer/guides-and-documentation/digital-onboarding).

## Contact us

For help and support connecting to this API and to join our developer community, see [Help and support building healthcare software](https://digital.nhs.uk/developer/help-and-support).
