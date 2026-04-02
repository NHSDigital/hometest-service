# SQS Current State

## Queues

Four queues are provisioned in `hometest-mgmt-terraform/infrastructure/src/hometest-app/sqs.tf` via the shared `infrastructure/modules/sqs` wrapper.

| Queue             | Type     | Status                                                                                               |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `order-placement` | Standard | Active — written by `order-service-lambda`, consumed by `order-router-lambda`                        |
| `events`          | Standard | Provisioned — `order-router-lambda` is wired as a consumer (see note below), nothing publishes to it |
| `order-results`   | Standard | Provisioned — no producer, no consumer                                                               |
| `notifications`   | FIFO     | Provisioned — no producer, no consumer                                                               |

**`events` queue note:** The `events` event source mapping wires any Lambda flagged `sqs_trigger = true` to this queue (batch size 10, 5 s batching window). Currently `order-router-lambda` is the only such Lambda, meaning it has two event source mappings: one to `order-placement` (its operational queue) and one to the unused `events` queue.

## Active Message Flow

```text
Patient → POST /order
  → order-service-lambda
      → DB: create patient/order/consent (transaction)
      → SQS: enqueue to order-placement
      → DB: set status = QUEUED
      → return 201

SQS order-placement → order-router-lambda (batch size 1)
    → validate & parse message body
    → DB: load supplier config
    → Secrets Manager: fetch supplier OAuth token
    → HTTP: POST FHIR order to supplier
    → DB: set status = SUBMITTED (best-effort, see error handling)
```

## Queue Configuration

| Setting             | order-placement | order-results | notifications | events    |
| ------------------- | --------------- | ------------- | ------------- | --------- |
| Visibility timeout  | 300 s           | 300 s         | 180 s         | 300 s     |
| Message retention   | 14 days         | 14 days       | 4 days        | 14 days   |
| DLQ retention       | 14 days         | 14 days       | 14 days       | 14 days   |
| max receive count   | 3               | 3             | 3             | 3         |
| Long polling        | 20 s            | 20 s          | 20 s          | 20 s      |
| Encryption          | KMS (CMK)       | KMS (CMK)     | KMS (CMK)     | KMS (CMK) |
| DLQ redrive enabled | Yes             | Yes           | Yes           | Yes       |

## Event Source Mapping — order-placement → order-router-lambda

| Setting                                           | Value                                                     |
| ------------------------------------------------- | --------------------------------------------------------- |
| Batch size                                        | 1                                                         |
| Partial batch failure (`ReportBatchItemFailures`) | Enabled                                                   |
| `bisect_batch_on_function_error`                  | Not configured                                            |
| Max concurrency                                   | Not configured (only set on the generic `events` ESM: 10) |

## Error Handling

### order-service-lambda (producer)

- The SDK client is configured with `maxAttempts: 3`; transient send failures are retried at the SDK level before the Lambda returns an error to the API caller.
- If `sendMessage` still fails, a structured `console.error` is logged and a `500` is returned to the caller — the order record exists in the DB but is never queued.
- If the subsequent `QUEUED` status write fails, a `500` is returned but the already-sent SQS message is not rolled back. The order is in the queue but its DB status may not reflect `QUEUED`.

### order-router-lambda (consumer)

- Every record is processed individually; failures push `{ itemIdentifier: record.messageId }` into `batchItemFailures`. Only failed records are retried; successful records in the same batch are deleted by Lambda.
- Every failure path throws, with one intentional exception: after a successful supplier HTTP call, a subsequent DB status update failure is caught, logged as `console.error`, and **not rethrown**. This is explicitly to prevent SQS from re-delivering the message and causing a duplicate order submission to the supplier. The order is considered submitted.
- All other failures (invalid message body, missing supplier config, OAuth failure, non-200/201 supplier response) propagate and result in the message being retried via SQS.

### order-result-lambda

`order-result-lambda` is **not an SQS consumer**. It is an HTTP handler (API Gateway POST `/result`) that receives FHIR Observation resources directly from suppliers. The `order-results` queue is provisioned but has no connection to this Lambda. Errors are handled by returning structured FHIR error responses (HTTP 4xx/5xx); there is no silent failure path.

## Monitoring

Three CloudWatch alarms are created per queue:

| Alarm                    | Metric                                   | Threshold       |
| ------------------------ | ---------------------------------------- | --------------- |
| `{queue}-age-high`       | `ApproximateAgeOfOldestMessage`          | 600 s           |
| `{queue}-depth-high`     | `ApproximateNumberOfMessagesVisible`     | 1,000           |
| `{queue-dlq}-depth-high` | DLQ `ApproximateNumberOfMessagesVisible` | 0 (any message) |

All alarms notify the SNS alerts topic. OK transitions also notify.
