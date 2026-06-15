# EVMAK / EVPAY PAYMENT INTEGRATION — FULL COMPLIANCE AUDIT

**Date:** 2026-06-01
**Auditor:** Principal Payments Architect & Security Auditor
**Scope:** 28 source files, 4 documentation files, Prisma schema, environment config
**Specification:** EvPay Checkout & Reconciliation API / EvMak API

---

## Executive Summary

**Overall Score: 2.7/10 — NO-GO for production.**

| Category | Score | Status |
|----------|-------|--------|
| Authentication | 0/10 | ❌ Bearer token instead of HMAC + X-* headers |
| Checkout Flow | 0/10 | ❌ Wrong endpoint, wrong format, wrong auth, no redirect |
| Webhook Security | 4/10 | ⚠️ Signature check exists but idempotency is broken |
| Refunds | 4/10 | ⚠️ Works for full refunds but no partial support, no idempotency |
| MNO Payments | 0/10 | ❌ Completely unimplemented — name only |
| Database Consistency | 5/10 | ⚠️ Schema missing 5 required EvPay fields |
| Error Handling | 4/10 | ⚠️ Internal errors leaked, generic messages for users |
| Observability | 5/10 | ⚠️ Audit logging present but no structured logging |
| Production Readiness | 2/10 | 🔴 Multiple CRITICAL issues prevent production deployment |
| **OVERALL** | **2.7/10** | **🔴 NO-GO** |

---

## A. AUTHENTICATION — 0/10 ❌

### Requirement
EvPay spec requires:
- `X-Client-Id` header
- `X-Timestamp` header (Unix)
- `X-Signature` header = `HMAC_SHA256(client_id + "|" + timestamp, client_secret)`

### Current Implementation

| File | Lines | What it does |
|------|-------|-------------|
| `src/features/payments/lib/evmak-client.ts` | 68-71 | Sends `Authorization: Bearer {EVMAK_API_KEY}` — **wrong auth scheme entirely** |
| same file | 35-37 | Reads `EVMAK_API_KEY` from env (used as Bearer token, not an HMAC key) |
| same file | 51-93 | Generic `request()` method — no `X-Client-Id`, `X-Timestamp`, or `X-Signature` headers anywhere |

### Failures
1. ❌ **No `X-Client-Id` header** — zero compliance
2. ❌ **No `X-Timestamp` header** — zero replay protection on outbound requests
3. ❌ **No `X-Signature` header** — no HMAC-SHA256 signing of any outbound payload
4. ❌ **Wrong algorithm** — uses Bearer token instead of `HMAC_SHA256(client_id + "|" + timestamp, client_secret)`
5. ❌ **No timestamp generation** — cannot detect clock drift
6. ❌ **No `EVMAK_CLIENT_ID` env variable** — required by spec but not defined anywhere

### Webhook Auth (Separate Issue)

`src/features/payments/lib/webhook-validator.ts` uses a **custom pipe-delimited HMAC scheme**:

```typescript
const message = [event, reference, status, amount, currency, timestamp, nonce].join("|")
const signature = HMAC-SHA256(message, EVMAK_WEBHOOK_SECRET)
```

This is **not documented** in any EvPay spec. The spec calls for `X-Client-Id`, `X-Timestamp`, `X-Signature` headers — not a payload field named `signature`.

---

## B. CHECKOUT INITIALIZATION — 0/10 ❌

### Requirement (per EvPay spec)
1. User POSTs to EvPay hosted checkout URL: `https://checkout.evmak.com/checkout/{clientId}`
2. Payload must be **Base64-encoded** JSON
3. Payload must be **HMAC-SHA256 signed**
4. Customer redirected to EvPay-hosted page

### Current Implementation

| Aspect | Required | Actual | File:Line |
|--------|----------|--------|-----------|
| Endpoint | `checkout.evmak.com/checkout/{clientId}` | `${EVMAK_API_URL}/payments/initialize` | `evmak-client.ts:99` |
| Payload format | Base64-encoded JSON | Raw JSON via `Content-Type: application/json` | `evmak-client.ts:72` |
| Signature | HMAC over Base64 payload | Bearer token | `evmak-client.ts:70` |
| Redirect | User redirected to checkout URL | Returns `paymentUrl` string — **caller must navigate manually** | `create-payment.ts:113-119` |
| Callback URL | Should be `/api/payments/callback` | Sends `baseUrl/api/payments/verify?paymentId=${id}` — **wrong path** | `create-payment.ts:74` |

### Payload Mismatch

**Sent:** `{ order_id, amount, currency, callback_url, cancel_url }` (snake_case)
**Required by spec:** Base64-encoded JSON with specific fields

---

## C. PAYMENT VERIFICATION / RECONCILIATION — 0/10 ❌

### Requirement
EvPay spec documents: **`GET /api/v1/reconciliation/{reference}`**

### Current Implementation

| File | Lines | Method | Endpoint |
|------|-------|--------|----------|
| `evmak-client.ts` | 108-112 | `POST` | `/payments/verify` |

### Failures
1. ❌ **Wrong HTTP method** — should be `GET`, implemented as `POST`
2. ❌ **Wrong endpoint** — `/payments/verify` vs `/api/v1/reconciliation/{reference}`
3. ❌ **Wrong auth** — Bearer token instead of `X-*` headers
4. ❌ **Wrong response parsing** — custom `VerifyPaymentResponse` type vs standard EvPay reconciliation response
5. ❌ **No reconciliation endpoint exposed** — no admin UI for reconciliation either

---

## D. WEBHOOKS & CALLBACKS — 4/10 ⚠️

### Current Implementation

| Feature | Status | Details |
|---------|--------|---------|
| Webhook route exists | ✅ | `POST /api/payments/webhook` (`route.ts` line 11) |
| Callback endpoint | ❌ | Spec requires `POST /api/payments/callback` — **directory exists but EMPTY** (`src/app/api/payments/callback/` has no `route.ts`) |
| Signature validation | ✅ | Custom HMAC-SHA256 scheme (`webhook-validator.ts:23-39`) |
| Timestamp validation | ✅ | 5-minute window (`webhook-validator.ts:44-47`) |
| Replay prevention | ⚠️ | In-memory `Set<string>` for nonces (`webhook-validator.ts:49-64`) |
| Idempotency / dedup | ❌ **FLAWED** | Uses `metadata: { contains: payload.nonce }` — **searches substring in JSON string**, not reliable |
| Duplicate transaction prevention | ❌ | See below |

### CRITICAL: Idempotency Bug — `webhook/route.ts:60-65`

```typescript
const existingTransaction = await prisma.paymentTransaction.findFirst({
  where: { paymentId: payment.id, reference: payload.reference, metadata: { contains: payload.nonce } },
})
```

**`contains` on a `String` field performs substring matching** on the raw JSON string. This means:
- Nonce `"abc"` matches metadata `'{"nonce":"abcdef"}'` — **false positive** (blocks legitimate webhook)
- Nonce `"xyz"` might not match if JSON stringified differently — **false negative** (allows duplicate)
- Nonce stored in metadata but `reference` field already matches — nonce lookup is redundant

### CRITICAL: In-Memory Nonce Set

`webhook-validator.ts:49` — `processedNonces` is a module-level `Set<string>`:
- **Lost on server restart** — replay window resets
- **Not shared across instances** — load-balanced deployments will accept duplicate webhooks
- **Automatic eviction at 10k entries** — old nonces removed, enabling replay

---

## E. ORDER STATUS SYNCHRONIZATION — 5/10 ⚠️

### Status Mapping Table

| EvMak Status | Prisma PaymentStatus | Prisma OrderStatus | Where | Lines |
|-------------|---------------------|-------------------|-------|-------|
| `completed` | `Paid` | `Processing` (if Pending) | `webhook/route.ts:69,99-111` | |
| `failed` | `Failed` | Unchanged | `webhook/route.ts:70` | |
| `refunded` | `Refunded` | `Refunded` | `webhook/route.ts:71,114-127` | |
| `cancelled` | `Cancelled` | Unchanged | `webhook/route.ts:72` | |
| `Pending` (EvMak) | `Processing` (fallback) | Unchanged | `webhook/route.ts:73` | |

### Issues Found

1. ❌ **`AUTHORIZED` is not mapped** — EvPay spec includes `AUTHORIZED` status but code has no handler
2. ❌ **`DECLINED` is not mapped** — spec uses `DECLINED`, but code maps `failed` only
3. ❌ **`CANCELLED` spelling** — EvPay uses `CANCELLED` (double L) but code maps `cancelled` (single L) — potential mismatch
4. ❌ **`Pending` → `Processing` fallback is wrong** — if EvMak returns `Pending`, the code maps it to `Processing` which is semantically incorrect
5. ❌ **No status transition validation in webhook** — `webhook/route.ts` does NOT call `isValidPaymentTransition()`. If webhook arrives after manual status change, it can produce invalid transitions.

---

## F. INVENTORY SYNCHRONIZATION — 3/10 ❌

### Inventory Flow Trace

| Event | Action | File:Line | Inventory Effect |
|-------|--------|-----------|-----------------|
| Order created | Reserve stock | `orders/index.ts:126-155` | ✅ `quantity--, reservedQuantity++` |
| Manual `Paid` | Commit stock | `orders/index.ts:439-465` | ✅ `reservedQuantity--` (STOCK_OUT) |
| Manual `Refunded` | Release stock | `orders/index.ts:468-495` | ✅ `quantity++, reservedQuantity--` |
| Manual `Cancelled` | Release stock | `orders/index.ts:555-591` | ✅ `quantity++, reservedQuantity--` |
| **Webhook `completed`** | — | `webhook/route.ts:99-111` | ❌ **No inventory update at all** |
| **Webhook `refunded`** | — | `webhook/route.ts:114-127` | ❌ **No inventory update at all** |
| **Webhook `cancelled`** | — | `webhook/route.ts:69-72` | ❌ **No inventory update** |

### CRITICAL: Webhook Path Misses Inventory

When a payment webhook arrives with status `completed`, the order is set to `Processing` but **reserved inventory is never committed** (never transitions from `RESERVED` to `STOCK_OUT`). The stock remains in limbo — deducted from available but stuck in reserved.

When a webhook `refunded` arrives, the order is set to `Refunded` but **inventory is never restored**.

### Race Condition

Multiple webhooks could fire simultaneously. The transaction wraps the DB writes but:
- `findFirst` on payment by reference does not use `SELECT ... FOR UPDATE`
- Two concurrent webhooks with same reference could both pass the `findFirst` check and create duplicate transactions

---

## G. REFUNDS — 4/10 ⚠️

| Feature | Status | Details |
|---------|--------|---------|
| Full refund | ✅ | Implemented |
| Partial refund | ❌ | Not supported — always refunds full `payment.amount` |
| Duplicate prevention | ❌ | No idempotency key. `refundPayment()` checks `status === "Paid"` but if called twice quickly, both could pass |
| Refund reason | ✅ | Optional reason string |
| Order status update | ✅ | Order set to `Refunded` |
| Audit logging | ✅ | Creates audit event |

### Critical: `evmak-client.ts:114-118`

```typescript
async refundPayment(reference: string, amount: number) {
  return this.request<RefundPaymentResponse>("/payments/refund", { reference, amount })
}
```

**Endpoint `/payments/refund` is NOT documented** in the EvPay spec. The spec mentions no refund API endpoint. This is a custom endpoint.

---

## H. MOBILE MONEY (MNO) API — 0/10 ❌

### Requirement (per spec)

Mobile Money payment requires:

| Field | Description |
|-------|-------------|
| `api_source` | Source identifier |
| `api_to` | Destination identifier |
| `amount` | Payment amount |
| `product` | Product code |
| `callback` | Callback URL |
| `hash` | `MD5(username\|date)` |
| `user` | Username |
| `mobileNo` | Customer mobile number |
| `reference` | Transaction reference |

### Current Implementation

**ZERO MNO-specific code exists.** The entire "mobile_money" implementation is:

- `src/config/constants.ts:110-115` — `"mobile_money"` listed in `PAYMENT_METHODS` array
- `src/features/orders/actions/index.ts:44` — Schema allows `paymentMethod: "mobile_money"`
- `src/app/(public)/checkout/client.tsx:374` — UI shows "Mobile Money" option with "M-Pesa, Tigo Pesa, Airtel Money" label

That's it. No:
- ❌ MNO API client
- ❌ `hash` generation (MD5)
- ❌ `mobileNo` collection from customer
- ❌ MNO callback handling
- ❌ MNO reconciliation
- ❌ MNO-specific status handling

---

## I. DATABASE CONSISTENCY — 5/10 ⚠️

### Prisma Schema (`prisma/schema.prisma`)

```prisma
enum PaymentStatus { Pending Processing Paid Failed Refunded Cancelled }

model Payment {
  id        String    @id @default(cuid())
  orderId   String    @unique
  method    String
  status    PaymentStatus @default(Pending)
  amount    Decimal   @db.Decimal(12, 2)
  currency  String    @default("TZS")
  reference String?
  paidAt    DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  order        Order                @relation(fields: [orderId], references: [id])
  transactions PaymentTransaction[]
}

model PaymentTransaction {
  id        String   @id @default(cuid())
  paymentId String
  status    String
  amount    Decimal  @db.Decimal(12, 2)
  reference String?
  metadata  String?
  createdAt DateTime @default(now())
  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
}
```

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | `method` is a plain `String`, not an enum — allows invalid payment methods | MEDIUM | `schema.prisma:405` |
| 2 | `PaymentTransaction.status` is a plain `String`, not `PaymentStatus` enum | MEDIUM | `schema.prisma:421` |
| 3 | `metadata` is `String?` (JSON blob) — no structure, no validation, no indexing | LOW | `schema.prisma:424` |
| 4 | Missing fields from EvPay spec: `payment_id`, `approval_code`, `card_type`, `card_masked`, `transaction_reference` | HIGH | `schema.prisma:402-416` |
| 5 | `reference` is not unique — two payments could theoretically share a reference | MEDIUM | `schema.prisma:409` |
| 6 | No `SELECT ... FOR UPDATE` (no `$transaction` isolation level set) | HIGH | All payment transactions |
| 7 | `cancelOrder()` inventory bug: picks wrong warehouse for multi-warehouse allocations | HIGH | `orders/index.ts:561` |

### PaymentTransaction.status is plain String

```typescript
// src/features/payments/schemas/payment.schema.ts
// PaymentTransaction.status in DB is String, but code stores PaymentStatus values
// No validation prevents storing "invalid_status" in the DB
```

### cancelOrder() Warehouse Bug

`src/features/orders/actions/index.ts:555-561`:

```typescript
const inventories = await tx.inventory.findMany({
  where: { productId: { in: items.map(i => i.productId) } },
})
// ...
const inv = inventories.find((i) => i.productId === item.productId)
```

This picks the **first** inventory record found per product, ignoring multi-warehouse allocations. If stock was reserved from warehouse A but this picks warehouse B, the wrong warehouse gets its stock adjusted.

---

## J. SECURITY REVIEW — 3/10 ❌

### Critical Findings

| # | Severity | Finding | File:Line |
|---|----------|---------|-----------|
| 1 | **CRITICAL** | **Webhook secret committed to git** — `EVMAK_WEBHOOK_SECRET=zcjjs5F0WmS5neza0FEvKftIezKGiwdM` in `.env` | `.env:17` |
| 2 | **CRITICAL** | **No rate limiting** on any payment API route — `/initialize`, `/verify`, `/refund`, `/webhook` all unauthenticated POST endpoints | All 4 `routes.ts` |
| 3 | **HIGH** | **In-memory nonce set lost on restart** — webhook replay possible after server restart | `webhook-validator.ts:49` |
| 4 | **HIGH** | **No idempotency key** for payment initialization or refund — double-init/double-refund possible | `create-payment.ts`, `refund-payment.ts` |
| 5 | **HIGH** | **Internal error details leaked** — exposes `status`, `statusText`, `body` in error messages | `evmak-client.ts:80` |
| 6 | **MEDIUM** | **`EVMAK_API_KEY` env var is empty** in `.env` — misconfiguration, falls through to manual payment mode silently | `.env:15` |
| 7 | **MEDIUM** | **No input validation on amount** in webhook/verify (though amount is read from DB) | — |
| 8 | **MEDIUM** | **Webhook doesn't authenticate the sender transport-layer** — only checks HMAC signature embedded in payload | `webhook/route.ts` |
| 9 | **LOW** | **`PaymentTransaction.metadata` is unvalidated JSON** — can store arbitrary data | `schema.prisma:424` |

### Payment API Routes — All Externally Accessible

| Route | File | Auth in Route Layer |
|-------|------|-------------------|
| `POST /api/payments/webhook` | `webhook/route.ts` | ❌ None (HMAC only in payload) |
| `POST /api/payments/initialize` | `initialize/route.ts` | ❌ None (delegates to server action) |
| `POST /api/payments/verify` | `verify/route.ts` | ❌ None (delegates to server action) |
| `POST /api/payments/refund` | `refund/route.ts` | ❌ None (delegates to server action) |

The API routes themselves don't enforce authentication — they rely on the server actions. But with no rate limiting, an attacker could hammer these endpoints.

---

## K. ENVIRONMENT VARIABLES

| Variable | `.env` | `.env.example` | `.env.production.example` | Status |
|----------|--------|---------------|--------------------------|--------|
| `EVMAK_API_KEY` | `""` (empty) | `""` (empty) | `""` (empty) | ❌ Empty in all envs |
| `EVMAK_API_URL` | `https://api.evmak.co.tz` | `https://api.evmak.co.tz` | `https://api.evmak.co.tz` | ✅ Set (but unverified URL) |
| `EVMAK_WEBHOOK_SECRET` | `zcjjs5F0WmS5neza0FEvKftIezKGiwdM` | `""` (empty) | `""` (empty) | ⚠️ Set but committed to git |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `http://localhost:3000` | `https://your-domain.com` | ✅ Used for callback URLs |

### Missing from env files entirely

| Variable | Purpose | Status |
|----------|---------|--------|
| `EVMAK_CLIENT_ID` | Required by EvPay spec for `X-Client-Id` header | ❌ Missing |
| `EVPAY_USERNAME` | Required for MNO MD5 hash generation | ❌ Missing |
| `EVMAK_RECONCILIATION_ENABLED` | Flag to enable/disable reconciliation | ❌ Missing |

---

## L. COMPLIANT ITEMS ✅

Despite the overall score, the following items are correctly implemented:

1. Prisma `Payment` and `PaymentTransaction` models exist with proper relations
2. Most operations wrapped in `$transaction` for atomicity
3. Audit logging for all payment events (create, complete, fail, refund, cancel)
4. Webhook signature validation (custom scheme, but exists and uses `timingSafeEqual`)
5. Webhook timestamp validation (5-minute window)
6. Admin and customer payment pages with search, filter, pagination
7. Ownership validation on customer payment queries (`userId` filter)
8. Role-based access on admin payment queries (`requireRole`)
9. Payment status transition validation in server actions (`isValidPaymentTransition`)
10. Payment status is a Prisma enum (not a string) on the `Payment` model

---

## M. NON-COMPLIANT ITEMS ❌

| # | Item | Required | Actual | Critical? |
|---|------|----------|--------|-----------|
| 1 | Auth headers | `X-Client-Id`, `X-Timestamp`, `X-Signature` | `Authorization: Bearer` | YES |
| 2 | Signature algorithm | `HMAC_SHA256(client_id \| timestamp, secret)` | No signature on outbound | YES |
| 3 | Checkout endpoint | `checkout.evmak.com/checkout/{clientId}` | Custom `/payments/initialize` | YES |
| 4 | Payload encoding | Base64-encoded JSON | Raw JSON | YES |
| 5 | Callback URL | `/api/payments/callback` | `/api/payments/verify?paymentId=X` | YES |
| 6 | Reconciliation | `GET /api/v1/reconciliation/{reference}` | `POST /payments/verify` | YES |
| 7 | Callback route | `POST /api/payments/callback` | Directory exists but empty | YES |
| 8 | EvPay fields stored | `payment_id`, `approval_code`, `card_type`, `card_masked`, `transaction_reference` | Only `reference` | YES |
| 9 | Status mapping | `AUTHORIZED`, `DECLINED`, `CANCELLED` | `completed`, `failed`, `cancelled` | YES |
| 10 | MNO fields | `api_source`, `api_to`, `hash`, etc. | Nothing | YES |

---

## N. MISSING FEATURES 🚫

- **MNO Payment API** — 0% implemented
- **Partial refunds** — not supported
- **Payment reconciliation dashboard** — no UI or endpoint
- **Idempotency keys** — for init, verify, and refund
- **Rate limiting** — on any payment API route
- **Persistent nonce store** — webhook replay protection lost on restart
- **`callback` route** — directory exists, file missing

---

## O. BUGS FOUND 🐛

| # | Bug | File:Line | Severity | Impact |
|---|-----|-----------|----------|--------|
| 1 | Webhook idempotency uses `contains` on JSON string | `webhook/route.ts:61` | HIGH | False positives/negatives on dedup |
| 2 | Webhook doesn't validate status transitions | `webhook/route.ts:69-73` | HIGH | Can produce invalid PaymentStatus values |
| 3 | Webhook `completed` doesn't commit inventory | `webhook/route.ts:99-111` | CRITICAL | Stock stuck in RESERVED permanently |
| 4 | Webhook `refunded` doesn't restore inventory | `webhook/route.ts:114-127` | CRITICAL | Stock lost permanently |
| 5 | `cancelOrder()` picks wrong inventory warehouse | `orders/index.ts:561` | HIGH | Stock restored to wrong warehouse |
| 6 | `PaymentTransaction.status` is plain String, not enum | `schema.prisma:421` | MEDIUM | Invalid statuses can be stored |
| 7 | `isValidPaymentTransition` not called in webhook | `webhook/route.ts` | HIGH | State machine violation possible |

---

## P. REQUIRED FIXES

### P0 — BLOCKER (Fix before ANY production deployment)

1. **Remove `EVMAK_WEBHOOK_SECRET` from git**, rotate the secret, add `.env` to `.gitignore`
2. **Fix webhook inventory** — commit stock on `completed`, restore on `refunded`/`cancelled`
3. **Fix webhook idempotency** — use DB-backed nonce (unique constraint on `nonce` field)
4. **Add status transition validation** to webhook handler
5. **Add rate limiting** to all payment API routes
6. **Fix the `contains` idempotency check** in `webhook/route.ts:61`

### P1 — HIGH (Complete before go-live)

7. **Rewrite `EvMakClient`** to use `X-Client-Id`, `X-Timestamp`, `X-Signature` with HMAC-SHA256
8. **Implement proper Base64-encoded payload** construction per EvPay spec
9. **Create `/api/payments/callback`** endpoint
10. **Add EvPay fields** to Prisma Payment model: `payment_id`, `approval_code`, `card_type`, `card_masked`, `transaction_reference`
11. **Add idempotency keys** to `initiatePayment()` and `refundPayment()`
12. **Change `PaymentTransaction.status`** to `PaymentStatus` enum
13. **Add `SELECT ... FOR UPDATE`** (isolation level) to webhook and verify transactions

### P2 — MEDIUM

14. **Implement MNO payment API client** with MD5 hash generation
15. **Implement reconciliation API client** (`GET /api/v1/reconciliation/{reference}`)
16. **Add partial refund** support
17. **Add persistent nonce store** (Redis/DB) for webhook replay prevention
18. **Add structured logging** for payment events

---

## Q. RECOMMENDED CODE CHANGES

### 1. Fix Authentication in `evmak-client.ts`

```diff
- headers: {
-   "Content-Type": "application/json",
-   "Authorization": `Bearer ${apiKey}`,
- },
+ const timestamp = Date.now().toString()
+ const message = `${clientId}|${timestamp}`
+ const signature = crypto.createHmac("sha256", clientSecret).update(message).digest("hex")
+ headers: {
+   "Content-Type": "application/json",
+   "X-Client-Id": clientId,
+   "X-Timestamp": timestamp,
+   "X-Signature": signature,
+ },
```

### 2. Fix Webhook Idempotency in `webhook/route.ts`

```diff
- const existingTransaction = await prisma.paymentTransaction.findFirst({
-   where: { paymentId: payment.id, reference: payload.reference, metadata: { contains: payload.nonce } },
- })
+ // Add field: nonce String @unique to PaymentTransaction schema
+ const existingTransaction = await prisma.paymentTransaction.findUnique({
+   where: { nonce: payload.nonce },
+ })
```

### 3. Add Inventory Handling in Webhook `webhook/route.ts`

```diff
  if (prismaStatus === "Paid" && payment.order.status === "Pending") {
+   // Commit reserved inventory
+   const items = await tx.orderItem.findMany({ where: { orderId: payment.order.id } })
+   for (const item of items) {
+     /* release reservedQuantity: decrement reservedQuantity */
+   }
  }
```

```diff
  if (prismaStatus === "Refunded") {
+   // Restore inventory
+   const items = await tx.orderItem.findMany({ where: { orderId: payment.order.id } })
+   for (const item of items) {
+     /* increment quantity, decrement reservedQuantity */
+   }
  }
```

### 4. Add Status Transition Validation in Webhook

```diff
+ import { isValidPaymentTransition } from "@/features/payments/lib/payment-status"

  // Before updating status:
+ const currentStatus = payment.status as PaymentStatus
+ if (!isValidPaymentTransition(currentStatus, prismaStatus)) {
+   return NextResponse.json({
+     success: false,
+     message: `Invalid transition: ${currentStatus} → ${prismaStatus}`
+   }, { status: 400 })
+ }
```

### 5. Add EvPay Fields to Prisma Schema

```diff
  model Payment {
+   payment_id           String?   @map("payment_id")
+   approval_code        String?   @map("approval_code")
+   card_type            String?   @map("card_type")
+   card_masked          String?   @map("card_masked")
+   transaction_reference String?  @map("transaction_reference")
  }

  model PaymentTransaction {
-   status    String
+   status    PaymentStatus
+   nonce     String?   @unique
  }
```

### 6. Add Rate Limiting Wrapper

```typescript
// src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}
```

```diff
// In each API route:
+ if (!checkRateLimit(request.headers.get("x-forwarded-for") ?? "unknown")) {
+   return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
+ }
```

---

## R. PRODUCTION READINESS ASSESSMENT

| Phase | Readiness | Description |
|-------|-----------|-------------|
| **Current** | **~15%** | Solid structural foundation but core payment integration is fundamentally non-compliant |
| **After P0 fixes** | **~40%** | Security holes patched, inventory consistency restored |
| **After P1 fixes** | **~60%** | Core flows compliant with EvPay spec, but MNO + partial refunds missing |
| **After P2 fixes** | **~85%** | Near production-ready |

---

## S. GO / NO-GO RECOMMENDATION

**NO-GO for production deployment.**

The system fails:
- 100% of authentication requirements
- 100% of checkout flow requirements
- 50% of webhook security requirements
- 100% of MNO payment requirements

Multiple critical security vulnerabilities exist:
- Committed secret
- No rate limiting
- Broken idempotency
- Inventory leaks on webhook path

### Minimum Gate to Pass

1. All P0 blockers fixed and verified
2. At least **7/10** on Authentication, Checkout Flow, and Webhook Security
3. Webhook secret rotated and removed from git history
4. Inventory consistency verified end-to-end (trace `RESERVED → STOCK_OUT → RELEASED`)
5. Load test with concurrent webhook delivery passes without duplicates
6. Penetration test on all payment API routes passes

---

## T. FILE INVENTORY (28 Source Files Audited)

### Payment Feature (`src/features/payments/`)

| File | Description |
|------|-------------|
| `actions/create-payment.ts` | Initiate payment — calls EvMak API, creates PaymentTransaction |
| `actions/verify-payment.ts` | Verify payment status — custom `/payments/verify` endpoint |
| `actions/refund-payment.ts` | Process refund — admin only, calls `/payments/refund` |
| `actions/get-payments.ts` | List payments (admin + customer variants) |
| `lib/evmak-client.ts` | EvMak HTTP client — Bearer auth, custom REST endpoints |
| `lib/webhook-validator.ts` | Webhook HMAC validation, timestamp check, nonce dedup |
| `lib/payment-status.ts` | Status labels, colors, transition validation map |
| `schemas/payment.schema.ts` | Zod schemas for init, verify, refund, list |
| `components/payment-table.tsx` | Reusable payment table component |
| `components/payment-status-badge.tsx` | Color-coded status badge |
| `components/transaction-history.tsx` | Transaction timeline component |

### API Routes (`src/app/api/payments/`)

| File | Description |
|------|-------------|
| `initialize/route.ts` | `POST /api/payments/initialize` |
| `verify/route.ts` | `POST /api/payments/verify` |
| `refund/route.ts` | `POST /api/payments/refund` |
| `webhook/route.ts` | `POST /api/payments/webhook` |
| `callback/` | **EMPTY** — no route.ts file |

### Orders Feature (`src/features/orders/actions/`)

| File | Lines | Description |
|------|-------|-------------|
| `index.ts` | 62-185 | `createOrder()` — creates Payment with Pending status |
| `index.ts` | 382-518 | `updateOrderStatus()` — handles Paid/Refunded inventory |
| `index.ts` | 520-631 | `cancelOrder()` — restores inventory, updates payment |

### Configuration & Schema

| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Payment + PaymentTransaction models, PaymentStatus enum |
| `src/types/index.ts` | PaymentStatus type (mismatch with Prisma enum) |
| `src/config/constants.ts` | PAYMENT_METHODS, PAYMENTS_MANAGE permission |
| `src/lib/auth/index.ts` | Better Auth config with role field |
| `src/lib/auth/session.ts` | requireAuth(), requireRole() helpers |

### Environment

| File | Description |
|------|-------------|
| `.env` | Active config — WEBHOOK_SECRET committed, API_KEY empty |
| `.env.example` | Template |
| `.env.production.example` | Production template |

---

*End of Audit Report*
