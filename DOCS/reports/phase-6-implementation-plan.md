# Phase 6 — Commerce Engine: Implementation Plan

**Date:** 2026-05-31

**Lead:** Principal Software Architect

**Current Phase:** Phase 6 — Commerce Engine (Order Management)

**Estimated Completion:** 0% (not started)

---

## 1. Current State Assessment

### What Exists
| Component | State | Location |
|---|---|---|
| Prisma Order model | ✅ Complete | `prisma/schema.prisma:351` |
| Prisma OrderItem model | ✅ Complete | `prisma/schema.prisma:371` |
| Prisma OrderStatusHistory model | ✅ Complete | `prisma/schema.prisma:386` |
| Prisma Payment model | ✅ Complete | `prisma/schema.prisma:397` |
| Prisma PaymentTransaction model | ✅ Complete | `prisma/schema.prisma:413` |
| OrderStatus enum (7 values) | ✅ Complete | `prisma/schema.prisma:17` |
| PaymentStatus enum (5 values) | ✅ Complete | `prisma/schema.prisma:27` |
| Cart Zustand store (localStorage) | ✅ Complete | `src/features/carts/store.ts` |
| Checkout 5-step wizard UI | 🟡 UI only (no submission) | `src/app/(public)/checkout/client.tsx` |
| Admin orders page | ❌ Skeleton (7 lines) | `src/app/(admin)/admin/dashboard/orders/page.tsx` |
| Customer account page | ❌ Placeholder for orders | `src/app/(customer)/account/page.tsx` |
| RBAC permissions (orders.*) | ✅ Defined in constants | `src/config/constants.ts` |
| Permission checking functions | ⚠️ Drizzle-based | `src/lib/permissions/index.ts` |
| Audit log function | ⚠️ Drizzle-based | `src/lib/logger/index.ts` |
| generateOrderNumber util | ✅ Exists | `src/lib/utils/index.ts:57` |
| Route protection (proxy) | ✅ Complete | `src/proxy.ts` |

### What's Missing
| Component | Priority | Effort |
|---|---|---|
| Prisma-based audit log (replace Drizzle) | Pre-requisite | 0.5 day |
| Checkout form state management & validation (Zod) | Critical | 0.5 day |
| Order server actions (create, read, list, update status) | Critical | 1 day |
| Checkout submission logic (cart → order conversion) | Critical | 1 day |
| Customer order history page (/account/orders) | High | 0.5 day |
| Customer order detail page (/account/orders/[id]) | High | 0.5 day |
| Admin orders list page | High | 0.5 day |
| Admin order detail page | High | 0.5 day |
| Admin order status management | High | 0.5 day |
| Order confirmation number display | Medium | 0.25 day |
| Low stock reservation on order creation | Medium | 0.5 day |
| Address model usage (billing/shipping) | Medium | 0.5 day |

---

## 2. Implementation Phases

### Phase 6a — Foundation (Prerequisite)

**Objective:** Replace Drizzle ORM dependencies in audit logging and permission checking with Prisma, enabling a clean Prisma-only order module.

**Files to create:**
- `src/lib/logger/prisma.ts` — Prisma-based audit log function

**Files to modify:**
- None — the new audit log will be imported directly by order actions

**Technical decisions:**
- Keep Drizzle-based auditLog for backward compatibility
- New order actions use a new `orderAuditLog()` that writes directly to Prisma's AuditLog model
- Permission checking for orders uses `requireRole()` from session (already Prisma-compatible) rather than Drizzle-based `hasPermission()`

---

### Phase 6b — Order Server Actions

**Objective:** Create all server actions for order management.

**File to create:**
- `src/features/orders/actions/index.ts`

**Server actions to implement (all "use server"):**

| Action | Description | Auth | Role |
|---|---|---|---|
| `createOrder(data)` | Convert checkout → order with items + status history | requireAuth | Any authenticated user |
| `getCustomerOrders(params)` | List customer's own orders (paginated) | requireAuth | Owner only |
| `getCustomerOrderById(id)` | Get single order with items + history | requireAuth | Owner only |
| `getAdminOrders(params)` | List all orders (filtered/sorted/paginated) | requireAuth | Admin/Sales/Support |
| `getAdminOrderById(id)` | Get any order with items + history + payment | requireAuth | Admin/Sales/Support |
| `updateOrderStatus(id, status, note)` | Change order status + add history entry | requireAuth | Admin/Sales/Support/Customer (cancel) |

**Key behavior for `createOrder`:**
1. Validate input with Zod schema (customer info, address, shipping method, payment method)
2. Compute totals: subtotal (from cart items with current prices), tax (configurable rate), shipping (based on method), total
3. Generate order number via `generateOrderNumber(crypto.randomUUID())`
4. Create Order with items snapshot (name, sku, price, quantity at time of order)
5. Create initial OrderStatusHistory ("Pending")
6. Create Payment record (Pending status)
7. Reserve inventory quantities (decrement from first-available warehouse)
8. Log audit entry
9. Return order ID and order number

**Types to export:**
- `OrderWithItems` — Order + OrderItem[] + OrderStatusHistory[]
- `CreateOrderInput` — Zod-inferred input type
- `UpdateOrderStatusInput` — Zod-inferred input type

---

### Phase 6c — Checkout Submission

**Objective:** Wire the checkout wizard to actually submit orders.

**Files to modify:**
- `src/app/(public)/checkout/client.tsx` — Major rewrite

**Changes:**
- Add React state for all form fields (customer info, billing address, shipping address, shipping method, payment method)
- Collect data across all 5 steps
- Add Zod validation schema for checkout form
- On "Place Order" (step 3 → 4 transition):
  1. Call `createOrder()` server action
  2. On success: show order number, clear cart, redirect to confirmation
  3. On failure: show error toast
- Step 4 becomes "Confirmation" showing order number + next steps

**Checkout data model:**
```typescript
interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  billingAddress: {
    street: string
    city: string
    state?: string
    zipCode?: string
    country: string
  }
  shippingAddress?: {
    sameAsBilling: boolean
    street: string
    city: string
    state?: string
    zipCode?: string
    country: string
  }
  shippingMethod: "standard" | "express" | "same_day"
  paymentMethod: "bank_transfer" | "mobile_money" | "credit_card"
  notes?: string
}
```

---

### Phase 6d — Customer Order Pages

**Files to create:**
- `src/app/(customer)/account/orders/page.tsx` — Order list
- `src/app/(customer)/account/orders/[id]/page.tsx` — Order detail

**Customer Order List (`/account/orders`):**
- Server component that calls `getCustomerOrders()`
- Table: order number, date, status (badge), total, items count
- Pagination
- Empty state: "No orders yet"
- Each row links to detail page

**Customer Order Detail (`/account/orders/[id]`):**
- Server component that calls `getCustomerOrderById()`
- Order info card: number, date, status, totals breakdown
- Items table: name, SKU, quantity, unit price, total
- Status history timeline
- Customer info (from form snapshot — stored as JSON on Order.notes or separate)
- Cancellation button (if status is Pending)

---

### Phase 6e — Admin Order Pages

**Files to create:**
- `src/features/orders/components/admin-order-table.tsx` — Reusable data table
- `src/features/orders/components/admin-order-status-dropdown.tsx` — Status change dropdown

**Files to modify:**
- `src/app/(admin)/admin/dashboard/orders/page.tsx` — Replace skeleton with full page

**Files to create:**
- `src/app/(admin)/admin/dashboard/orders/[id]/page.tsx` — Order detail

**Admin Order List (`/admin/dashboard/orders`):**
- Server component with search, status filter, date range
- Data table: order number, customer name, email, items count, total, status, date
- Status badges with color coding
- Sort by date, total, status
- Pagination
- Row click → detail page

**Admin Order Detail (`/admin/dashboard/orders/[id]`):**
- Order info: number, dates, customer details
- Items table
- Status history timeline
- Status management: dropdown to change status + optional note
- Payment info (if exists)
- Actions: update status, add note

---

## 3. Zod Schemas

### Order Creation Schema
```typescript
const createOrderSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default("Tanzania"),
  }),
  shippingAddress: z.object({
    sameAsBilling: z.boolean().default(true),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  shippingMethod: z.enum(["standard", "express", "same_day"]),
  paymentMethod: z.enum(["bank_transfer", "mobile_money", "credit_card"]),
  notes: z.string().optional(),
})
```

### Status Update Schema
```typescript
const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
})
```

---

## 4. Database Impact

| Change | Type | Required |
|---|---|---|
| No schema changes needed | — | ✅ Schema already complete |

The existing Prisma schema already contains all required models (Order, OrderItem, OrderStatusHistory, Payment). No migration changes needed.

---

## 5. Security Impact

| Area | Risk | Mitigation |
|---|---|---|
| Customer order access | Unauthorized users viewing others' orders | `getCustomerOrderById` enforces `userId === order.userId` |
| Admin order access | Non-admin users accessing admin endpoints | `requireRole("super_admin", "admin", "sales_manager", "customer_support")` |
| Status escalation | Unauthorized status changes | `requireRole` + validation of allowed transitions |
| Order creation rate | Abuse | Rate limiting via server action error handling |
| Cart price manipulation | Users altering prices before order | Re-fetch current product prices in server action — never trust client prices |
| Audit trail | Missing change history | Every status change → `AuditLog` entry |

### Key Security Rule: Never Trust Client Prices
The `createOrder` server action MUST:
1. Re-fetch current product prices from DB
2. Recalculate subtotal from server-side prices × quantities
3. Not use client-submitted price values

---

## 6. Order Status Transition Rules

```
Pending → Processing (admin)
Pending → Cancelled (admin or customer)
Processing → Shipped (admin)
Processing → Cancelled (admin)
Shipped → Delivered (admin)
Delivered → Cancelled (admin)
Any → Refunded (admin, finance only)
```

---

## 7. File Creation Plan (Ordered)

```
src/features/orders/
  actions/
    index.ts          # All order server actions (~200 lines)
  
src/app/(customer)/
  account/orders/
    page.tsx          # Customer order list (~50 lines)
    [id]/
      page.tsx        # Customer order detail (~80 lines)

src/app/(admin)/
  admin/dashboard/
    orders/
      page.tsx        # Admin order list (replaces skeleton, ~100 lines)
      [id]/
        page.tsx      # Admin order detail (~100 lines)

src/features/orders/
  components/
    admin-order-table.tsx           # Reusable data table (~150 lines)
    admin-order-status-dropdown.tsx # Status change component (~80 lines)
    order-status-badge.tsx          # Status badge component (~40 lines)
    order-items-table.tsx           # Items table component (~60 lines)
    order-status-timeline.tsx       # Status history component (~60 lines)
    customer-order-card.tsx         # Mobile-friendly order card (~40 lines)
```

---

## 8. File Modification Plan

```
src/app/(public)/checkout/client.tsx    # Major: add form state, validation, submission
src/app/(customer)/account/page.tsx     # Minor: link orders to real page
```

---

## 9. Route Changes

| Route | Type | Action |
|---|---|---|
| `/checkout` | Dynamic | Modify (add submission logic) |
| `/account/orders` | Dynamic | Create |
| `/account/orders/[id]` | Dynamic | Create |
| `/admin/dashboard/orders` | Dynamic | Modify (replace skeleton) |
| `/admin/dashboard/orders/[id]` | Dynamic | Create |

---

## 10. Order Status Badge Colors

| Status | Color |
|---|---|
| Pending | Yellow/amber |
| Processing | Blue |
| Paid | Green |
| Shipped | Indigo/purple |
| Delivered | Emerald |
| Cancelled | Red |
| Refunded | Red/orange |

---

## 11. Estimated Timeline

| Phase | Days | Dependencies |
|---|---|---|
| Phase 6a — Foundation (Prisma audit log) | 0.5 | None |
| Phase 6b — Order Server Actions | 1.0 | Phase 6a |
| Phase 6c — Checkout Submission | 1.0 | Phase 6b |
| Phase 6d — Customer Order Pages | 1.0 | Phase 6b |
| Phase 6e — Admin Order Pages | 1.5 | Phase 6b |
| **Total** | **5 days** | |

---

## 12. Out of Scope (Future Phases)

| Feature | Rationale |
|---|---|
| Payment integration (EvMak) | Phase 7 — dedicated payment phase |
| Email notifications | Requires email provider setup |
| Order invoices / PDF generation | Phase 8 — after payment |
| Shipping carrier integration | Requires third-party API |
| Coupon/discount codes | Needs coupon model |
| Guest checkout (no account) | Requires guest session merge with user account on order |
| Real-time inventory deduction on checkout | Can be added in Phase 8 (Inventory) |
| Order returns / RMA | Future phase |

---

## 13. Validation Steps

After each sub-phase:

```bash
npm run build          # TypeScript + Next.js build
npx prisma validate    # Schema validation (if changed)
npm run lint           # ESLint
```

---

## 14. Completion Criteria

Phase 6 is COMPLETE when:

- ✅ Authenticated user can complete checkout → order created in DB
- ✅ Order number shown to user after successful checkout
- ✅ Cart cleared after order creation
- ✅ Customer can view their order list at `/account/orders`
- ✅ Customer can view order detail at `/account/orders/[id]`
- ✅ Customer can cancel pending orders
- ✅ Admin can view all orders with search/filter/sort/pagination
- ✅ Admin can view any order detail
- ✅ Admin can change order status with audit trail
- ✅ Order prices are server-validated (never trust client prices)
- ✅ All order mutations are audit-logged
- ✅ 0 TypeScript errors in production build
- ✅ Build passes (`npm run build`)
