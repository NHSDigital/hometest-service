# SQS & Error Handling — Future Recommendations

## 1. Clean up unused queues and the duplicate `events` ESM

`order-results`, `notifications`, and `events` are provisioned but carry no messages. Each still incurs CloudWatch alarms and ongoing KMS/encryption costs.

- If `order-results` and `notifications` are intended for future use, add a `TODO` comment in `sqs.tf` naming the planned producer/consumer so intent is clear.
- If they have no near-term roadmap, remove them.
- The `events` queue creates a redundant event source mapping on `order-router-lambda` (which already has its own dedicated ESM to `order-placement`). Unless `events` is intended as a separate trigger path, remove the generic `aws_lambda_event_source_mapping.sqs` resource or decouple it from `order-router-lambda`.

## 2. Fix the visibility timeout and add exponential backoff with jitter

AWS recommends visibility timeout ≥ 6× Lambda timeout. `order-router-lambda` has a 60 s timeout; the queue has a 300 s visibility timeout (5×). Raise to at least 360 s (6×) so a message isn't re-queued while a slow invocation is still running.

```hcl
visibility_timeout_seconds = 360
```

Beyond the static timeout, SQS does not natively back off between retries — every re-delivery is immediate once the visibility window expires. For an auto-retryable failure against a recovering supplier API, hammering every 360 seconds is unhelpful. The `order-router-lambda` handler can call `ChangeMessageVisibility` on a failing record before returning it in `batchItemFailures`, extending the timeout exponentially based on `attributes.ApproximateReceiveCount` (available on every `SQSRecord`). Adding jitter prevents a convoy of messages all retrying in sync after an outage clears.

One viable operating model is:

- Main queue retention: 2 days, so auto-retryable failures are either processed or surfaced to the DLQ within roughly 48 hours.
- Auto-retryable failures: exponential backoff with jitter, sized so retries are spread across that 48-hour window rather than clustered.
- DLQ retention: keep 14 days, since once a message is dead-lettered the priority shifts from retry pacing to operator inspection and recovery time.

This is more targeted than simply raising `max_receive_count` (see item 8) — backoff controls _when_ retries happen; receive count controls _how many_. Both should be set together.

## 3. Classify errors as auto-retryable or not in `order-router-lambda`

Currently all failures are treated as retryable — any exception pushes the message ID into `batchItemFailures`, causing SQS to re-deliver until `max_receive_count` is exhausted. This wastes retry attempts on failures that will never self-heal, and sends legitimate patient orders to the DLQ unnecessarily.

**The right question at the SQS loop level is not "is this error permanent?" but "will waiting and retrying automatically fix this?"** That is a narrower, more answerable question.

Errors that belong in the SQS retry loop (add to `batchItemFailures`, apply exponential backoff with jitter):

- 5xx from supplier — transient server error
- 429 from supplier — rate limited; back off and retry
- Network/timeout failures — transient infrastructure
- Daily test quote for supplier exceeded (must clarify how exactly this is surfaced)

Errors that are not good candidates for exponential backoff:

- 4xx from supplier (other than 429) — includes 400 (bad payload), 401 (auth config), 404 (wrong endpoint), etc.
- Schema/validation failures on the message body — payload is malformed and won't change on retry
- Supplier not found in DB — config issue

This second group is not necessarily _permanently_ broken — a 401 might be fixed by rotating credentials, a 404 by correcting a config value, a 400 by identifying a mapping bug. But none of these fix themselves with time; they require a deliberate action before the message can succeed.

There are two credible ways to handle this group:

- Remove them from the SQS retry loop entirely once durable failure persistence exists (see item 6), because the queue is not the right place to wait for a manual fix.
- Keep them on the queue for a small fixed number of attempts while the system remains DLQ-centric. In that model, a pragmatic policy is to leave them on the default 360-second visibility timeout and cap them at 3 receives, while reserving exponential backoff for the genuinely transient group above.

In either model, these messages must not be silently discarded. They need an operator-visible failure path, whether that is the DLQ alone or a separate persistence mechanism.

An `isTransient(error)` helper (note: _transient_, not _retryable_ — the distinction matters) can classify based on HTTP status and known error types. When in doubt, treat as transient and let the DLQ act as the final backstop.

## 4. Enable `bisect_batch_on_function_error`

Not currently set on either ESM. When enabled, Lambda automatically halves a failing batch to isolate a poison-pill message more quickly, reducing wasted retry attempts before the bad message reaches the DLQ. Safe to enable alongside `ReportBatchItemFailures`.

```hcl
bisect_batch_on_function_error = true
```

## 5. Address the QUEUED status / enqueue race condition in `order-service-lambda`

If `sendMessage` succeeds but the subsequent `QUEUED` status write fails, the order is in the queue with no `QUEUED` DB status. `order-router-lambda` will process it and attempt to write `SUBMITTED`, skipping `QUEUED` entirely.

**Option A:** Wrap the `sendMessage` and `addOrderStatusUpdate` calls in a single DB transaction with an outbox pattern — persist the message to an `outbox` table inside the transaction, then publish from the outbox. This eliminates the race entirely.

**Option B:** Reverse the order — write `QUEUED` to DB first, then send to SQS. If SQS fails, the DB record stays as `QUEUED` and a separate reconciliation process (or manual intervention) can re-queue it. Easier to implement; less robust under sustained SQS unavailability.

**Option C:** Treat the queue write as the source-of-truth step for the user-facing flow. If `sendMessage` succeeds but the `QUEUED` status write fails, do not return an error to the user; log the failure for alerting and investigation, and let downstream processing continue from the queued message. This is operationally simple, but it assumes later status handling is tolerant of missing intermediate states.

## 6. Integrated error handling: DLQ, persistent failure store, and triage

The DLQ alone is insufficient for production. SQS has a 14-day retention limit, provides no random access, and gives no structured way to track which failed messages have been reviewed or reprocessed. Given these are patient orders, audit trail and targeted reprocessing matter.

The right mental model is: **queues are excellent for retryable failures** (outage recovery, bad deploy — drain the DLQ and retry everything); **a database is the right home for audit, triage, and non-retryable failures**. They should be used together.

Below are three progressively more capable approaches:

### Option A — DLQ + manual triage

- Inspect messages in the AWS Console or via CLI; redrive in bulk.
- Pro: no additional infrastructure.
- Con: no random access, 14-day retention, no structured audit trail, poor UX for per-message decisions. Does not handle non-retryable errors (item 3).

### Option B — DLQ consumer Lambda writes to a `failed_messages` table

- A Lambda consumes the DLQ and writes failed message payloads (with error context, receive count, timestamp) to a DB table. Reprocessing is a DB update + re-enqueue.
- Pro: indefinite retention, random access, queryable by order UID. Relatively simple to implement.
- Con: the DB table is a separate concern from the main order state; two places to check per failed order. Does not solve the enqueue race condition (item 5).

### Option C — Outbox pattern as primary store (addresses items 5 and 6 together)

- Messages are written to an `outbox` DB table _inside the originating transaction_ (alongside the order record). A separate process polls the outbox and enqueues to SQS. The DB row is the source of truth; the queue is the delivery mechanism.
- Failed/DLQ'd messages are always traceable to a DB row. Non-retryable failures update the row status rather than being discarded silently. Reprocessing is a targeted DB update.
- Pro: eliminates the enqueue/QUEUED race; indefinite retention; unified state model; supports both retryable and non-retryable failure paths cleanly.
- Con: higher implementation complexity; requires a reliable outbox poller (e.g. a scheduled Lambda or EventBridge Pipes reading the outbox table).

**Bulk reprocessing after an outage:** each outbox row carries a `status` field (e.g. `pending`, `enqueued`, `failed`, `non_retryable`). During an outage, affected rows accumulate in `failed`. To reprocess, run a targeted SQL update — filtered by time window, supplier, error type, or any combination — flipping those rows back to `pending`. The outbox poller then picks them up and re-enqueues automatically; no manual DLQ interaction is needed. This also makes it straightforward to exclude specific messages (poison pills, non-retryable failures) from a bulk retry by leaving their status unchanged.

Regardless of which option is used, a triage runbook must document: how to inspect failed messages, how to distinguish transient from permanent failures, how to redrive safely (throttled), and who is accountable given the patient data involved.

For bulk redrives from the DLQ back to the source queue:

```bash
aws sqs start-message-move-task \
  --source-arn <dlq-arn> \
  --destination-arn <source-queue-arn> \
  --max-number-of-messages-per-second 1
```

Limit the rate to avoid overwhelming a supplier or DB that has just recovered.

## 7. Supplier idempotency for DLQ redrives

If a message lands in the DLQ after a successful supplier submission (e.g. the `SUBMITTED` status write failed after a successful HTTP call), redriving it will re-submit to the supplier. That makes supplier idempotency a prerequisite for safe bulk redrives.

At present, this appears to be an open question rather than a confirmed property. The practical next step is to add it to a supplier question list and confirm, for each supplier, whether re-submitting the same order with the same `X-Correlation-ID` is treated as idempotent. If not, redrives must be handled manually per-message rather than as a bulk operation.

## 8. Set `max_receive_count` to fit the retry window

With exponential backoff in place (item 2), `max_receive_count` controls the total number of attempts rather than purely the retry window. If the main queue retention is reduced to 2 days, the more useful design target is not an arbitrary receive count but a retry schedule that spans roughly 48 hours before the message reaches the DLQ.

That suggests two separate policies:

- Auto-retryable failures: set `max_receive_count` high enough that, together with exponential backoff and jitter, retries are spread across the full 48-hour main-queue window.
- Non-auto-retryable failures that remain on SQS for now: keep the default 3 receives and the baseline 360-second visibility timeout, so they surface quickly rather than consuming the whole retry window.

This keeps the long retry budget for failures likely to self-heal, while ensuring configuration, validation, and other operator-action errors reach the DLQ quickly for inspection.

## 9. Add concurrency limit to `order_router_order_placement` ESM

The generic `events` ESM has `maximum_concurrency = 10`, but the dedicated `order_router_order_placement` ESM does not. Without a cap, a burst of messages could spin up Lambda concurrency proportional to queue depth, potentially exhausting the shared Aurora Serverless connection pool. Set an explicit limit appropriate for the DB connection limit.

```hcl
scaling_config {
  maximum_concurrency = 10
}
```

## 10. Batch size optimisation

`order-placement` uses batch size 1, which is safe and simple but limits throughput. The existing handler already processes records concurrently via `Promise.all`, so the code change to support a larger batch is minimal — the tuning is primarily infrastructure config.

Key constraints to measure before increasing batch size:

- **Aurora Serverless connection pool**: each concurrently processed record in a batch needs a DB connection; connection exhaustion will cause failures.
- **Supplier rate limits**: if a supplier enforces a request rate, concurrent processing of a larger batch could breach it.
- **Lambda memory**: each in-flight record within a batch consumes memory; profile at current memory_size (512 MB) before increasing.

The `maximum_batching_window_in_seconds` (already set to 5 s on the `events` ESM) is the complementary lever — letting messages accumulate before Lambda is invoked, improving efficiency at lower throughput. The right next step here is measurement: add the metrics needed to understand duration, error rate, supplier behaviour, and DB connection utilisation, and run performance tests before changing batch size. Without that data, batch-size tuning is guesswork and risks cascading failures.
