# Payment Implementation Audit Report

**Date:** 2026-05-31
**Auditor:** AI-assisted code review
**Scope:** Full payment system vs official EvPay Checkout & Reconciliation API documentation

---

## Executive Summary

The current payment implementation shares **zero compliance** with the official EvPay Integration Guide. The entire system is a custom-built abstraction that does not match any of the documented EvPay flows. A complete rewrite is required.

---

## Requirement-by-Requirement Audit

### 1. Customer must be redirected to EvPay hosted checkout

| Aspect | Required | Current |
|--------|----------|---------|
| Flow | User POSTs to EvPay checkout URL | User calls `initiatePayment()` which returns a `paymentUrl` string |
| Redirect | User redirected to EvPay-hosted page | **No redirect occurs** — caller must manually navigate |
| Payload delivery | Base64-encoded payload in checkout URL | Uses arbitrary REST POST to `EVMAK_API_URL/payments/initialize` |

**Status:** ❌ FAIL

---

### 2. Payload must be Base64 encoded

| Aspect | Required | Current |
|--------|----------|---------|
| Encoding | `base64_encode(JSON.stringify(payload))` | Sends raw JSON via `Content-Type: application/json` |
| Transport | Encoded string embedded in checkout URL or header | REST POST with JSON body |

**Status:** ❌ FAIL

---

### 3. Payload must be signed using HMAC-SHA256

| Aspect | Required | Current |
|--------|----------|---------|
| Algorithm | HMAC-SHA256 over the Base64 payload | Bearer token via `Authorization` header |
| Secret | Shared secret between merchant and EvPay | Uses `EVMAK_API_KEY` as Bearer token, not HMAC key |
| Verification | EvPay verifies signature on receipt | **No HMAC signature on outbound requests** |

**Status:** ❌ FAIL

---

### 4. Checkout URL must use `https://checkout.evmak.com/checkout/{clientId}`

| Aspect | Required | Current |
|--------|----------|---------|
| URL format | `https://checkout.evmak.com/checkout/{clientId}` | Configurable `EVMAK_API_URL` env var |
| Client ID | Passed as path parameter | No client ID in URL at all |
| Checkout URL | Returned by EvPay API | Constructed arbitrarily by customer code |

**Status:** ❌ FAIL

---

### 5. Implement `/api/payments/callback` callback endpoint

| Aspect | Required | Current |
|--------|----------|---------|
| Endpoint | `POST /api/payments/callback` | Has `/api/payments/webhook`, `/api/payments/verify`, `/api/payments/initialize` |
| Callback URL | Sent with payment request to EvPay | Sends `${baseUrl}/api/payments/verify?paymentId=${id}` — wrong path |
| Processing | EvPay POSTs callback after customer completes payment | Custom webhook validator with nonce+timestamp scheme |

**Status:** ❌ FAIL

---

### 6. Store payment_id, approval_code, card_type, card_masked, transaction_reference

| Field | Required | Current Prisma Model |
|-------|----------|---------------------|
| `payment_id` | Yes — EvPay transaction ID | ❌ Missing |
| `approval_code` | Yes — bank approval code | ❌ Missing |
| `card_type` | Yes — card brand (Visa, Mastercard, etc.) | ❌ Missing |
| `card_masked` | Yes — masked PAN (e.g., `4444xxxxxx1111`) | ❌ Missing |
| `transaction_reference` | Yes — EvPay reference | ⚠️ Has `reference` field, but no `transaction_reference` |

**Current model fields:** `id`, `orderId`, `method`, `status`, `amount`, `currency`, `reference`, `paidAt`, `createdAt`, `updatedAt`

**Status:** ❌ FAIL — 4 of 5 required fields missing

---

### 7. Reconciliation API `GET /api/v1/reconciliation/{reference}`

| Aspect | Required | Current |
|--------|----------|---------|
| Endpoint | `GET /api/v1/reconciliation/{reference}` | Not implemented |
| Purpose | Verify payment status against EvPay | Has custom `verifyPayment()` that calls `/payments/verify` |
| Response | Standard EvPay reconciliation response | Custom `VerifyPaymentResponse` type |

**Status:** ❌ FAIL — Not implemented

---

### 8. Secure signature generation with X-Client-Id, X-Timestamp, X-Signature

| Aspect | Required | Current |
|--------|----------|---------|
| Headers | `X-Client-Id`, `X-Timestamp`, `X-Signature` | `Authorization: Bearer {apiKey}` |
| Signature | HMAC-SHA256 of `{timestamp}.{base64payload}` | Not implemented |
| Timestamp | Unix timestamp in header for replay protection | Not implemented |

**Note:** The webhook validator uses a custom pipe-delimited HMAC scheme (`event|reference|status|amount|currency|timestamp|nonce`) which does not match the EvPay spec.

**Status:** ❌ FAIL

---

### 9. Remove fake/mock/custom payment verification logic

| File | Issue |
|------|-------|
| `src/features/payments/lib/evmak-client.ts` | Entire client is custom — uses Bearer auth, arbitrary REST endpoints, wrong payload format |
| `src/features/payments/lib/webhook-validator.ts` | Custom pipe-delimited HMAC scheme, custom nonce dedup — does not match EvPay |
| `src/features/payments/actions/verify-payment.ts` | Calls fake `/payments/verify` endpoint — EvPay does not have this |
| `src/features/payments/actions/create-payment.ts` | Sends REST POST instead of constructing Base64 signed payload for hosted checkout |
| `src/features/payments/actions/refund-payment.ts` | Calls fake `/payments/refund` endpoint — no such EvPay API documented |
| `src/app/api/payments/verify/route.ts` | Exposes fake verification endpoint not in EvPay spec |
| `src/app/api/payments/initialize/route.ts` | Exposes custom init endpoint not in EvPay spec |
| `src/app/api/payments/refund/route.ts` | Exposes custom refund endpoint not in EvPay spec |

**Status:** ❌ FAIL — 8 files contain non-compliant logic

---

### 10. Refactor to match official EvPay documentation

| Area | Required | Current |
|------|----------|---------|
| Payload construction | Base64-encoded JSON with specific fields | Raw JSON |
| Signature | HMAC-SHA256 with `X-*` headers | Bearer token |
| Checkout flow | Redirect to `checkout.evmak.com/checkout/{clientId}` | Arbitrary API URL |
| Callback | POST to `/api/payments/callback` | No callback endpoint |
| Reconciliation | `GET /api/v1/reconciliation/{reference}` | Not implemented |
| Database schema | 5 specific fields per spec | Only 1 (reference) |
| Error handling | Standard EvPay error codes | Custom error handling |
| Retry logic | Idempotency keys, replay detection | Custom retry (max 2) with no idempotency |

**Status:** ❌ FAIL — 0% compliant

---

## Summary

| Requirement | Status |
|-------------|--------|
| 1. Hosted checkout redirect | ❌ |
| 2. Base64 payload encoding | ❌ |
| 3. HMAC-SHA256 payload signing | ❌ |
| 4. Correct checkout URL format | ❌ |
| 5. Callback endpoint | ❌ |
| 6. Required fields stored | ❌ |
| 7. Reconciliation API | ❌ |
| 8. Signature headers | ❌ |
| 9. Removal of fake logic | ❌ |
| 10. Full compliance | ❌ |

**Compliance Score: 0/10**

---

## Recommended Action

Complete rewrite of the entire payment system:
1. Add `payment_id`, `approval_code`, `card_type`, `card_masked`, `transaction_reference` to Prisma
2. Build new EvPay SDK with Base64 encoding + HMAC-SHA256 signing + `X-Client-Id/X-Timestamp/X-Signature` headers
3. Implement hosted checkout redirect to `https://checkout.evmak.com/checkout/{clientId}`
4. Create `/api/payments/callback` endpoint
5. Implement reconciliation API client
6. Remove all custom verification logic
7. Add idempotency keys and replay protection
8. Preserve existing audit logging infrastructure
