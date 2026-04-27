# SQS & Error Handling — Agreed Decisions

This document records the agreed decisions for points 1 to 10 from the SQS and error-handling review, separate from the options paper in `sqs-and-error-handling-future-recommendations.md`.

## 1. Clean up unused queues and the duplicate `events` ESM

Decision: implement the fix as stated.

Justification: the unused queues are creating avoidable cost and operational noise, and the duplicate `events` event source mapping is redundant unless it is intentionally serving a separate trigger path.

## 2. Fix the visibility timeout and add exponential backoff with jitter

Decision: set the main queue visibility timeout to 360 seconds, reduce main queue retention to 2 days, retain DLQ retention at 14 days, and implement exponential backoff with jitter for auto-retryable failures so retries are spread across a maximum 48-hour window.

Justification: AWS recommends visibility timeout at least 6 times the Lambda timeout, and the 48-hour retry window aligns with supplier daily processing caps while still surfacing stuck messages promptly to the DLQ.

## 3. Classify errors as auto-retryable or not in `order-router-lambda`

Decision: apply exponential backoff with jitter only to auto-retryable failures. For non-auto-retryable failures, keep the simpler policy of 3 attempts using the default 360-second visibility timeout.

Justification: transient failures benefit from a longer retry window, while validation, configuration, and similar operator-action failures should surface to the DLQ quickly rather than consuming that entire window.

## 4. Enable `bisect_batch_on_function_error`

Decision: implement the fix as stated.

Justification: this isolates poison-pill messages more quickly and reduces wasted retry attempts before a bad message reaches the DLQ.

## 5. Address the `QUEUED` status / enqueue race condition in `order-service-lambda`

Decision: use the logging-based approach described as Option C. If `sendMessage` succeeds but the `QUEUED` status write fails, do not return an error to the user; log the failure and allow downstream processing to continue.

Justification: once the message is on the queue, the order will continue to be processed. Logging the failure is the simplest operational response for now, and the solution architect explicitly preferred this until there is better evidence on frequency and impact.

## 6. Integrated error handling: DLQ, persistent failure store, and triage

Decision: use Option A for now: DLQ plus manual triage.

Justification: this is the agreed immediate operating model. The more capable persistence options remain available for later if the current approach proves insufficient.

## 7. Supplier idempotency for DLQ redrives

Decision: do not assume supplier idempotency. Record this as an open supplier question and confirm, for each supplier, whether re-submitting the same order with the same `X-Correlation-ID` is idempotent before relying on bulk redrives.

Justification: if a supplier submission succeeded before the message reached the DLQ, redriving could create a duplicate order unless the supplier endpoint is idempotent.

## 8. Set `max_receive_count` to fit the retry window

Decision: configure `max_receive_count` to support the 48-hour retry window for auto-retryable failures, rather than choosing an arbitrary fixed number. Keep non-auto-retryable failures at 3 receives.

Justification: the design target is a two-day retry period for transient failures, not a specific receive count. For non-auto-retryable failures, quick DLQ visibility is more useful than a prolonged retry cycle.

## 9. Add concurrency limit to `order_router_order_placement` ESM

Decision: implement the fix as stated.

Justification: an explicit concurrency cap reduces the risk of a queue burst exhausting shared Aurora Serverless database connections.

## 10. Batch size optimisation

Decision: do not change batch size yet. First add the required metrics and, if needed, performance testing to understand duration, error rate, supplier behaviour, and database connection usage.

Justification: batch-size tuning without production-relevant metrics is guesswork and risks introducing cascading failures.
