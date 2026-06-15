# Phase 7 — Payment Engine: Implementation Report

## Audit Summary

### Prisma Schema (Verified)
- `PaymentStatus` enum: `Pending`, `Processing`, `Paid`, `Failed`, `Refunded`
- `Payment` model (line 397): id, orderId (unique FK→Order), method, status, amount, currency, reference?, paidAt?, timestamps, transactions[]
- `PaymentTransaction` model (line 413): id, paymentId (FK→Payment), status (String), amount, reference?, metadata? (JSON string), createdAt
- **Gap**: `PaymentStatus` enum missing `Cancelled` state (needed for cancelled payments)

### Order Workflow (Verified)
- `createOrder` (line 55): Creates Payment with status `Pending` inside a transaction. Uses `method` from checkout form (`bank_transfer`, `mobile_money`, `credit_card`).
- `updateOrderStatus` (line 382): When status → `Paid`, updates payment status to `Paid` + sets `paidAt`. Does **not** create PaymentTransaction records.
- `cancelOrder` (line 451): Restores inventory. Does **not** update payment status.
- `getAdminOrderById` (line 336): Includes payment + transactions (already wired).
- `getCustomerOrderById` (line 229): Includes payment (no transactions extracted).

### Files Verified
- `src/features/payments/` — exists, **empty** (no files)
- `src/app/api/payments/` — **does not exist**
- `src/app/(admin)/admin/dashboard/payments/page.tsx` — skeleton (8 lines, placeholder)
- `src/app/(admin)/admin/dashboard/payments/[id]/` — **does not exist**
- `src/app/(customer)/account/payments/` — **does not exist**
- Customer layout sidebar: **no Payments link** (currently: Dashboard, Orders, Quotes, Wishlist, Addresses, Notifications, Profile, Settings)
- Admin layout sidebar: **has Payments link** (CreditCard icon → `/admin/dashboard/payments`)
- Account dashboard page: **no Payments quick link** (currently: Orders, Quotes, Wishlist, Notifications)

### EvMak Configuration (Verified)
- `.env.example`: `EVMAK_API_KEY`, `EVMAK_API_URL` (`https://api.evmak.com/v1`), `EVMAK_WEBHOOK_SECRET`
- **Not present** in `.env`

### Auth & Security
- `requireAuth()`, `requireRole("super_admin", "admin", ...)` available
- Better Auth with `prismaAdapter`, cookie-based sessions via `gk_session`
- `proxy.ts` protects `/admin/*`, `/account/*`, `/checkout/*` routes

### Logger Patterns
- `src/lib/logger/prisma.ts` — `logAuditEvent()` with `AUDIT_ACTIONS` constants. Used by order actions.
- `src/lib/logger/index.ts` — `auditLog()` function + `logger.info/warn/error` console logger

### Existing API Route Pattern
- `src/app/api/auth/[...all]/route.ts` — uses `toNextJsHandler(auth.handler)`

---

## Missing Items Identified

| # | Item | Status |
|---|------|--------|
| 1 | `PaymentStatus` enum missing `Cancelled` | Needs schema update |
| 2 | No EvMak client library | Needs creation |
| 3 | No payment server actions | Needs creation |
| 4 | No payment API routes (initialize, verify, webhook, refund) | Needs creation |
| 5 | Admin payments list page (skeleton only) | Needs full implementation |
| 6 | Admin payment detail page (missing entirely) | Needs creation |
| 7 | Customer payments list page (missing entirely) | Needs creation |
| 8 | Customer payment detail page (missing entirely) | Needs creation |
| 9 | Customer sidebar missing Payments link | Needs layout update |
| 10 | Account dashboard missing Payments quick link | Needs layout update |
| 11 | `updateOrderStatus` manual "Paid" path doesn't create transaction records | Needs integration |
| 12 | No payment components (status badge, table, transaction history) | Needs creation |

---

## Implementation Plan

### Step 1 — Prisma Schema Update
- **File**: `prisma/schema.prisma`
- **Change**: Add `Cancelled` to `PaymentStatus` enum

### Step 2 — EvMak Client Library
- **File**: `src/features/payments/lib/evmak-client.ts`
- HTTP client for EvMak API (initialize payment, verify payment, refund)
- Uses `EVMAK_API_KEY`, `EVMAK_API_URL` from env
- Request/response types for EvMak API

### Step 3 — Payment Status Constants
- **File**: `src/features/payments/lib/payment-status.ts`
- Status display labels, colors for badges
- Transition validation map

### Step 4 — Webhook Validator
- **File**: `src/features/payments/lib/webhook-validator.ts`
- Signature verification using `EVMAK_WEBHOOK_SECRET`
- Replay attack prevention (timestamp + nonce)

### Step 5 — Payment Schema
- **File**: `src/features/payments/schemas/payment.schema.ts`
- Zod schemas for payment actions (initialize, verify, refund)

### Step 6 — Payment Server Actions
- **File**: `src/features/payments/actions/create-payment.ts`
  - Initiate EvMak payment for an order
  - Validates amount from DB
  - Creates PaymentTransaction record
  - Calls EvMak API
  - Returns redirect URL
- **File**: `src/features/payments/actions/verify-payment.ts`
  - Verify payment status from EvMak
  - Used as fallback for client-side polling
- **File**: `src/features/payments/actions/refund-payment.ts`
  - Process refund
  - Validates role (super_admin, admin)
  - Checks payment is Paid
  - Calls EvMak refund
  - Updates payment + order status
  - Creates audit log
- **File**: `src/features/payments/actions/get-payments.ts`
  - List payments (admin + customer variants with pagination, search, filter, sort)

### Step 7 — Payment API Routes
- **File**: `src/app/api/payments/initialize/route.ts` — POST: Initiate payment
- **File**: `src/app/api/payments/verify/route.ts` — POST: Verify payment status
- **File**: `src/app/api/payments/webhook/route.ts` — POST: Receive EvMak webhook
  - Validates signature
  - Prevents replay (idempotency key)
  - Stores raw payload
  - Updates payment + order status
  - Creates PaymentTransaction + audit log
- **File**: `src/app/api/payments/refund/route.ts` — POST: Process refund

### Step 8 — Payment Components
- **File**: `src/features/payments/components/payment-status-badge.tsx`
  - Color-coded badge for PaymentStatus
- **File**: `src/features/payments/components/payment-table.tsx`
  - Reusable admin payment table with columns (reference, order, customer, amount, status, date)
- **File**: `src/features/payments/components/transaction-history.tsx`
  - Transaction timeline component for payment detail page

### Step 9 — Admin Payment Pages
- **File**: `src/app/(admin)/admin/dashboard/payments/page.tsx`
  - Full payment list with search, status filter, pagination, sort
- **File**: `src/app/(admin)/admin/dashboard/payments/[id]/page.tsx`
  - Payment detail + transaction history + refund action

### Step 10 — Customer Payment Pages
- **File**: `src/app/(customer)/account/payments/page.tsx`
  - Payment history list for logged-in user
- **File**: `src/app/(customer)/account/payments/[id]/page.tsx`
  - Payment detail with receipt info, transaction timeline

### Step 11 — Layout Updates
- **File**: `src/app/(customer)/layout.tsx`
  - Add `Payments` sidebar link with `CreditCard` icon
- **File**: `src/app/(customer)/account/page.tsx`
  - Add Payments quick link card
- Admin sidebar already has Payments link (no change)

### Step 12 — Order Workflow Integration
- **File**: `src/features/orders/actions/index.ts`
  - `updateOrderStatus`: When manually setting `Paid`, also create a PaymentTransaction record
  - `cancelOrder`: When cancelling a paid order, update payment to `Cancelled`/`Refunded`

---

## Security Considerations
- Webhook endpoint: Validate signature using HMAC-SHA256 with `EVMAK_WEBHOOK_SECRET`
- Idempotency: Store webhook `id`/`event_id` in PaymentTransaction metadata, reject duplicates
- Rate limiting: Apply to payment initialization endpoints
- Amount validation: Never trust client-provided amounts — always read from DB
- Ownership validation: Customer payment queries filtered by `userId`
- Audit logging: Every payment action (create, complete, fail, refund, cancel) creates an audit log

---

## Files to Create (18 files)

```
src/features/payments/
├── lib/
│   ├── evmak-client.ts
│   ├── payment-status.ts
│   └── webhook-validator.ts
├── schemas/
│   └── payment.schema.ts
├── actions/
│   ├── create-payment.ts
│   ├── verify-payment.ts
│   ├── refund-payment.ts
│   └── get-payments.ts
├── components/
│   ├── payment-status-badge.tsx
│   ├── payment-table.tsx
│   └── transaction-history.tsx

src/app/api/payments/
├── initialize/route.ts
├── verify/route.ts
├── webhook/route.ts
└── refund/route.ts
```

## Files to Modify (4 files)

```
prisma/schema.prisma
src/features/orders/actions/index.ts
src/app/(customer)/layout.tsx
src/app/(customer)/account/page.tsx
```
