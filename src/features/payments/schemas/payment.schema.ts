import { z } from "zod"
import type { PaymentStatus } from "@/lib/prisma"

export const InitializePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
})

export type InitializePaymentInput = z.infer<typeof InitializePaymentSchema>

export const VerifyPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
})

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>

export const RefundPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z.string().optional(),
  amount: z.number().positive().optional(),
})

export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>

export const GetPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type GetPaymentsInput = z.infer<typeof GetPaymentsSchema>

export const ReconcilePaymentSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
})

export type ReconcilePaymentInput = z.infer<typeof ReconcilePaymentSchema>

export const CallbackPayloadSchema = z.object({
  reference: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  timestamp: z.number(),
  nonce: z.string(),
  signature: z.string(),
  transaction_reference: z.string().optional(),
  approval_code: z.string().optional(),
  card_type: z.string().optional(),
  card_masked: z.string().optional(),
  payment_id: z.string().optional(),
  gateway_status: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CallbackPayload = z.infer<typeof CallbackPayloadSchema>

export const MnoPaymentSchema = z.object({
  orderId: z.string().min(1),
  phoneNumber: z.string().min(5, "Valid phone number required"),
  provider: z.enum(["mpesa", "tigo_pesa", "airtel_money", "halopesa"]),
  amount: z.number().positive().optional(),
})

export type MnoPaymentInput = z.infer<typeof MnoPaymentSchema>
