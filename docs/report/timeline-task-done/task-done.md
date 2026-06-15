# GK General Supply — Project Status Report

> **Generated:** 2026-05-31

---

## What Has Been Done

### Auth & Session
- Better Auth server config with email/password, session expiry, rate limiting
- Client-side `SignInForm` and `SignUpForm` using `authClient` (no server action cookie issues)
- `SignOutButton` with client-side sign-out
- `requireAuth()` with DB role fallback
- `requireRole()` redirects instead of throwing
- `additionalFields: { role, phone }` in Better Auth config
- Profile form with `useActionState` + loading spinner
- Address CRUD with per-button loading spinners
- Cancel order button with `useFormStatus` pending state

### Cart & Checkout
- Zustand cart store with localStorage persistence
- `syncCartAction` with product existence check (fixes FK violation)
- 3-step checkout flow: info → shipping → payment
- Saved address prefill, conditional shipping validation, controlled `sameAsBilling`
- Order creation: reads items from Zustand store state (not DB — fixes "Cart is empty")
- Checkout UX: `stepLoading` + spinner on Back, toast on validation failure

### Products & Categories
- Product listing with realtime search (500ms debounce)
- Autocomplete suggestions
- Category filtering includes child subcategory IDs (products in subcategories show on parent page)
- Subcategory slug resolution to `typeId`
- `sku` field in Zustand `CartItem` type

### Orders & Payments
- `createOrder`, `updateOrderStatus` with `isValidTransition` (Processing→Paid now allowed)
- Payment verification handles Pending→Processing and Processing→Paid
- EvMak payment provider: optional via `isConfigured()`, all calls wrapped in try/catch
- `OrderStatusTimeline` — Badge hydration fix (div not p)

### Admin
- Sidebar with hamburger toggle + backdrop overlay for mobile
- Dashboard: real DB queries for revenue, orders, customers, products, recent orders, low stock, activities
- Products CRUD with image upload
- Categories CRUD
- Inventory management with movement history (nested `orderBy` via `setNested`)
- Warehouses CRUD
- Orders management
- Quotes management
- Customers list with order count
- Payments management
- Analytics
- Users list
- Roles list
- CMS pages
- Audit Log
- Settings (static read-only info)
- All tables wrapped in `overflow-x-auto` + `min-w-[640px]` for mobile
- Forms use `grid sm:grid-cols-2` for mobile collapse

### Performance & Architecture
- Extracted `buttonVariants` from client component into shared file (11 imports fixed)
- All server action imports changed from dynamic `import()` to static imports
- Prisma v7 with `prisma.config.ts` + `@prisma/adapter-pg`
- Generated client in `src/generated/prisma`
- Raw SQL (`$queryRaw`/`$executeRaw`) for new models (avoids cached client)

### Customer Pages
- Account dashboard
- Orders list & detail
- Quotes list & detail
- Wishlist
- Addresses
- Notifications
- Profile & settings
- Contact page with submission form
- Newsletter subscription in footer
- Forgot password / reset password

---

## What Still Needs Work

### High Priority

| Item | Details |
|---|---|
| **Header dead links** | `/about`, `/faq`, `/shipping`, `/returns` in `header.tsx` quickLinks — all 404. Either create the pages or remove the links. |
| **Stale directories** | `account/[`, `account/order/[id]`, `account/quote/[id]` — empty, should be deleted. |
| **ImageKit env vars** | `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` are empty. Product image upload will crash at runtime. |
| **EvMak API key** | `EVMAK_API_KEY` is empty. Payment flow will crash at runtime. |

### Medium Priority

| Item | Details |
|---|---|
| **Brand management** | Schema exists, storefront display works, but no admin CRUD page (create/edit/delete brands). |
| **Review system** | `Review` model in schema — zero implementation (no submit form, no display, no moderation). |
| **Subscriber admin panel** | `Subscriber` model + subscribe action in footer exist, but no admin list/export/delete UI. |
| **Contact submission inbox** | `ContactSubmission` stored via contact form, but no admin page to view submissions. |
| **Recently viewed products** | `RecentlyViewed` model exists but no UI to display them anywhere. |
| **Admin settings page** | Currently static read-only info, no actionable settings management. |
| **Role/permission management UI** | Roles page lists them but has no create/edit/delete or permission assignment UI. |
| **Outdated audit report** | `DOCS/reports/payments/project-audit-report.md` still calls many pages "skeleton" — now outdated. |

### Lower Priority

| Item | Details |
|---|---|
| **Email verification flow** | `Verification` model + `/verify-email` page exist, but `emailVerification` not enabled in Better Auth config. |
| **OAuth providers** | No Google/GitHub/other social login. |
| **Cart merge on login** | `syncCartAction` exists but no proper guest→user cart merge when logging in. |
| **Automated tests** | Zero test files across the entire codebase. |
| **CI/CD pipeline** | No GitHub Actions or equivalent. |
| **Sitemap & robots.txt** | Route files exist but no static XML generation. |
| **Docker production config** | Dockerfile exists but no production `docker-compose.yml`. |
| **`updatedAt` DB triggers** | Several models rely on Prisma client-level `@updatedAt` — won't update on raw SQL writes. |

---

## Known Bugs

| Bug | File | Status |
|---|---|---|
| Stale empty route directories | `account/[`, `account/order/[id]`, `account/quote/[id]` | Not critical but should clean up |
| Header links to 404 pages | `src/components/layouts/header.tsx` | Users clicking About, FAQ, Shipping, Returns get 404 |

---

## Build Commands

```bash
npm run dev          # Start dev server
npx prisma db push   # Push schema changes (not migrate dev)
```
