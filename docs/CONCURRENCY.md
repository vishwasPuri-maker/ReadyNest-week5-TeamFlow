# Concurrency & Consistency — How TeamFlow prevents overselling

> The critic's challenge: *"If two cashiers sell the last unit of the same item
> at the exact same moment, how do you handle database locks and consistency?
> If the architecture fails at scale, tenant data gets corrupted."*

This document is the answer, with a reproducible proof.

## The problem: lost updates / race conditions

A naive sale does **read-then-write**:

```
Cashier A reads stock = 1  → ok, available
Cashier B reads stock = 1  → ok, available   (both saw 1)
Cashier A writes stock = 0
Cashier B writes stock = 0                    → OVERSOLD: 2 sold, 1 in stock
```

Two clients read the same value and both write back — the second write silently
overwrites the first. Result: negative/oversold inventory.

## The fix: atomic conditional decrement

We never read-then-write. The stock check and the decrement happen in **one
atomic SQL statement** ([orders.controller.ts](../backend/src/modules/orders/orders.controller.ts)):

```sql
UPDATE "Product"
SET stock = stock - :qty
WHERE id = :productId
  AND "organizationId" = :orgId   -- tenant isolation
  AND stock >= :qty;              -- refuses to go negative
```

- Postgres takes a **row-level lock** for the `UPDATE` and re-evaluates
  `stock >= qty` against the **latest committed value**. Concurrent sales of the
  same row therefore **serialize** — they take turns, not overlap.
- If a sale can't be satisfied, **0 rows are affected**; we detect that and abort
  with `409 Insufficient stock`.
- The decrements **and** the order/line-item inserts run inside **one
  transaction**, so it's all-or-nothing. A failure rolls everything back — no
  partial sale, no orphaned stock change.

### Additional safeguards

| Concern | Mitigation |
|---|---|
| Deadlocks on multi-item orders | Lines are **sorted by `productId`** so every transaction locks rows in the same order. |
| Transient write conflicts | Retried up to 3× (Prisma error `P2034`). |
| Lock held too long (remote DB latency) | Prices are read **before** the transaction; only the decrement + insert run under the lock, keeping the critical section tiny. |
| Connection/lock queue timeouts | `timeout` / `maxWait` raised to 20s; pool sized via `connection_limit`. |
| Cross-tenant corruption | **Every** query is `organizationId`-scoped, so concurrency is per-row within one tenant — tenants can never touch each other's rows. |
| Money precision | Prices stored as **integer paise**, never floats. |

## Why not just `SELECT … FOR UPDATE`?

That (pessimistic locking) also works, but needs an explicit read+lock round-trip
before the write. The atomic conditional `UPDATE` achieves the same guarantee in
a single statement — fewer round-trips, less lock-hold time, better throughput.
Optimistic locking (a `version` column with retry) is a third valid option, best
when writes are rare and reads dominate.

## Proof — the stress test

[`backend/scripts/concurrency-test.mjs`](../backend/scripts/concurrency-test.mjs)
sets a product to `stock = 5`, then fires **20 simultaneous orders** (from two
different cashiers) each buying 1 unit.

```bash
# backend running on :4000, seeded
node backend/scripts/concurrency-test.mjs
```

Expected — and verified — output:

```
Product "USB-C Cable" set to stock = 5
Firing 20 simultaneous orders, each buying 1 unit...

✅ Succeeded (sold):     5
🛑 Rejected (409 stock): 15
📦 Final stock:          0

PASS ✅  Exactly 5 sold, 15 correctly rejected, stock hit 0 — NO OVERSELL, NO NEGATIVE STOCK.
```

Exactly the available 5 units sell; the other 15 requests are cleanly rejected;
stock lands on 0 and never goes negative. The race condition is provably handled.
