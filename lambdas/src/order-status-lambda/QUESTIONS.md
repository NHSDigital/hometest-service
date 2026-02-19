# Implementation

1. Our current seed data has a small subset of task statuses in comparison to the official docs, are we keeping with the subset for now, or shall I update to accommodate all statuses?
2. Do we want to reject if there is a newer update in the db or add it for auditing purposes (from the ticket)
3. According to the ticket, we need to confirm whether the `authoredOn` or `lastModified` fields will br present?
4. AC3 specifies we will only allow `DISPATCHED` or `RECEIVED` as business status', but our integration docs suggest a different subset https://github.com/NHSDigital/hometest-supplier-integration-framework/blob/main/docs/status-transitions.md, which shall we use?
5. There is no mention in the ticket pertaining to the rules specified in the doc above for handling business statuses, should we implement them in this ticket or are they for a later date?
6. Similarly there are requirements for handling idempotency here https://github.com/NHSDigital/hometest-supplier-integration-framework/blob/main/docs/idempotency.md, should they be implemented in this ticket?
7. Should we account for the correlation id header not being present? If so should we generate one and store it?
8. For idempotency matches, are we returning the latest data from our database, or just bouncing back the request data?

## Technical

1. Should I rely on existing seed data, or add some specific to my feature?
2. Am I right in assuming we are expected to generate a postman collection for testing purposes?
3. The seed data task statuses in our database uses UPPER_KEBAB_CASE whereas the fhir documentation uses kebab-case, does this have further implications throughout the codebase?
4. Do we want to create a table to store business status and reference it similar to `result_type` and `status_type`
5. Our status types (seeded in the `status_type` table) use UPPER_SNAKE_CASE whereas the fhir documentation uses kebab-case, are we expecting to consume kebab-case values but map to our own representation of them in the `order_status` table?
