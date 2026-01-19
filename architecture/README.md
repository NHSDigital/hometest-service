# Architecture

This directory contains the technical design and interface specifications. For high-level business
context, clinical safety documentation, and project roadmaps, please refer to
our [Confluence Space](https://nhsd-confluence.digital.nhs.uk/spaces/HOM/pages/1135298574/Architecture).

> ![NOTE]
> These are subject to change and are not final. The source of truth for the latest design is the
> Confluence Space linked above.

### API Specifications

The service uses [OpenAPI 3.0](https://www.openapis.org/) and [HL7 FHIR](https://www.hl7.org/fhir/)
standards for data exchange.

#### Home Test API Specifications

**[`api_spec.yaml`](./api_spec.yaml)**
The primary API definition for the HomeTest Service. It covers:

- **Test Order Service**: Retrieving supplier info, checking eligibility (using NHS numbers and
  postcodes), and placing orders.
- **Result Service**: Submitting and viewing test results.
- **FHIR Resources**: Utilizes `ServiceRequest` for orders, `Observation` for results, and `Task`
  for status tracking.

#### Supplier API Specifications

**[`supplier_api_spec.yaml`](./supplier_api_spec.yaml)**
Defines the expected interface for external test suppliers. This ensures a consistent integration
pattern regardless of the specific vendor fulfillment logic.

### Diagrams

- **[`AWS_Component_Diagram.drawio.png`](./AWS_Component_Diagram.drawio.png)**: A technical diagram
  showing the AWS resource layout. It illustrates how the Lambda functions, API Gateway, and
  PostgreSQL database interact within the cloud environment.

## Design Principles

1. **FHIR Compliant**: All medical data (orders, results, patients) follows FHIR standards to ensure
   interoperability across the NHS ecosystem.
2. **Supplier Agnostic**: The core service acts as an orchestrator, delegating fulfillment to
   multiple suppliers through a standardised adapter pattern.
3. **Serverless First**: Built on AWS Lambda to provide scalability and cost-efficiency.
