export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SALES_MANAGER: "sales_manager",
  INVENTORY_MANAGER: "inventory_manager",
  FINANCE_MANAGER: "finance_manager",
  CUSTOMER_SUPPORT: "customer_support",
  CUSTOMER: "customer",
} as const

export const PERMISSIONS = {
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  ORDERS_VIEW: "orders.view",
  ORDERS_MANAGE: "orders.manage",
  INVENTORY_MANAGE: "inventory.manage",
  PAYMENTS_MANAGE: "payments.manage",
  USERS_MANAGE: "users.manage",
  ANALYTICS_VIEW: "analytics.view",
  SETTINGS_MANAGE: "settings.manage",
  QUOTES_VIEW: "quotes.view",
  QUOTES_MANAGE: "quotes.manage",
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",
  REVIEWS_MODERATE: "reviews.moderate",
  WAREHOUSES_MANAGE: "warehouses.manage",
  ROLES_MANAGE: "roles.manage",
  AUDIT_VIEW: "audit.view",
} as const

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.WAREHOUSES_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [ROLES.SALES_MANAGER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
  ],
  [ROLES.INVENTORY_MANAGER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.WAREHOUSES_MANAGE,
    PERMISSIONS.ORDERS_VIEW,
  ],
  [ROLES.FINANCE_MANAGER]: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  [ROLES.CUSTOMER_SUPPORT]: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.QUOTES_VIEW,
  ],
  [ROLES.CUSTOMER]: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
  ],
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "under_review",
  "negotiation",
  "approved",
  "rejected",
  "converted",
] as const

export const PAYMENT_METHODS = [
  "credit_card",
  "bank_transfer",
  "mobile_money",
  "cash",
] as const

export const INVENTORY_MOVEMENT_TYPES = [
  "received",
  "shipped",
  "adjustment",
  "transfer",
  "return",
] as const

export const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A to Z", value: "name_asc" },
  { label: "Name: Z to A", value: "name_desc" },
] as const

export const ITEMS_PER_PAGE = 12
export const ADMIN_ITEMS_PER_PAGE = 20
