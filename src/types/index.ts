import type { z } from "zod"

export type ActionState<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SortParams = {
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export type SearchParams = {
  query?: string
  page?: number
  pageSize?: number
} & SortParams

export type ProductStatus = "active" | "inactive" | "draft"
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partial"
export type QuoteStatus = "draft" | "sent" | "under_review" | "negotiation" | "approved" | "rejected" | "converted"
export type UserRole = "super_admin" | "admin" | "sales_manager" | "inventory_manager" | "finance_manager" | "customer_support" | "customer"
export type InventoryMovementType = "received" | "shipped" | "adjustment" | "transfer" | "return"
export type NotificationType = "order" | "quote" | "payment" | "inventory" | "system" | "marketing"

export type Address = {
  id: string
  label: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
  isDefault: boolean
}

export type User = {
  id: string
  name: string
  email: string
  image?: string | null
  role: UserRole
  phone?: string | null
}

export type Product = {
  id: string
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  categoryId?: string | null
  brand?: string | null
  sku: string
  unit: string
  price: string
  salePrice?: string | null
  images: string[]
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  onSale: boolean
  rating: number
  reviewCount: number
}

export type CartItem = {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  unitPrice: string
  totalPrice: string
  product?: Product
}

export type Order = {
  id: string
  orderNumber: string
  status: OrderStatus
  total: string
  paymentStatus: PaymentStatus
  createdAt: string
  items: OrderItem[]
}

export type OrderItem = {
  id: string
  productId: string
  name: string
  sku: string
  quantity: number
  unitPrice: string
  totalPrice: string
}
