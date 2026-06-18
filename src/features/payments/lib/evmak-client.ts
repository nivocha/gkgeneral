import {
  createOutboundSignature,
  createCheckoutSignature,
  generateTimestamp,
  base64Encode,
  generateNonce,
} from "@/features/payments/lib/signature"
import { getPaymentEnv } from "@/lib/env"
import { ProviderError } from "@/features/payments/lib/errors"

export type InitializePaymentRequest = {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  callbackUrl: string
  cancelUrl: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone?: string
  billingAddress?: {
    street: string
    city: string
    state?: string | null
    zipCode?: string | null
    country: string
  }
}

export type InitializePaymentResponse = {
  success: boolean
  paymentUrl: string
  reference: string
  message?: string
}

export type VerifyPaymentResponse = {
  success: boolean
  status: "Pending" | "Processing" | "Paid" | "Failed" | "Refunded" | "Cancelled"
  reference: string
  paidAt: string | null
  gatewayStatus?: string
  transactionReference?: string
  approvalCode?: string
  cardType?: string
  cardMasked?: string
  paymentId?: string
  message?: string
}

export type RefundPaymentResponse = {
  success: boolean
  reference: string
  transactionReference?: string
  message?: string
}

export type ReconciliationResponse = {
  success: boolean
  reference: string
  status: string
  amount: number
  currency: string
  transactionReference?: string
  approvalCode?: string
  paymentId?: string
  paidAt?: string
  gatewayResponse?: Record<string, unknown>
  message?: string
}

class EvMakClient {
  private timeoutMs: number
  private maxRetries: number

  constructor() {
    this.timeoutMs = 15000
    this.maxRetries = 2
  }

  private getCheckoutUrl(): string {
    const { mnoApiUrl, clientId } = getPaymentEnv()
    return `${mnoApiUrl}checkout/${clientId}`
  }

  private getApiBaseUrl(): string {
    return "https://checkout.evmak.com/api/v1"
  }

  isConfigured(): boolean {
    const { clientId, clientSecret } = getPaymentEnv()
    return !!(clientId && clientSecret)
  }

  private async apiRequest<T>(
    endpoint: string,
    body: Record<string, unknown>,
    method: "POST" | "GET" = "POST",
    retries = 0
  ): Promise<T> {
    const baseUrl = this.getApiBaseUrl()
    const timestamp = generateTimestamp()
    const { signature, clientId } = createOutboundSignature(timestamp)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": clientId,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
        Accept: "application/json",
      },
      signal: controller.signal,
    }

    if (method === "POST") {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        throw new ProviderError(
          `Provider returned ${response.status}`,
          response.status,
          errorBody
        )
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ProviderError) {
        throw error
      }

      if (retries < this.maxRetries) {
        return this.apiRequest<T>(endpoint, body, method, retries + 1)
      }

      throw new ProviderError("Provider request failed after retries")
    }
  }

  async initializePayment(
    params: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    const reference = params.orderNumber
    const phoneNumber = params.customerPhone
      ? params.customerPhone.replace(/[^0-9]/g, "").replace(/^0+/, "255")
      : undefined

    const addr = params.billingAddress
    const payload: Record<string, string> = {
      total: params.amount.toFixed(2),
      currency: params.currency,
      reference,
      country: "TZ",
      firstName: params.customerFirstName,
      lastName: params.customerLastName,
      email: params.customerEmail,
      phoneNumber: phoneNumber || "",
      address1: addr?.street || "N/A",
      locality: addr?.city || "Dar es Salaam",
      administrativeArea: addr?.state || addr?.city || "Dar es Salaam",
      postalCode: addr?.zipCode || "",
      returnUrl: params.callbackUrl,
    }

    const encodedPayload = base64Encode(payload)
    const signature = createCheckoutSignature(encodedPayload)

    const checkoutUrl = `${this.getCheckoutUrl()}?data=${encodeURIComponent(encodedPayload)}&sig=${signature}`

    return {
      success: true,
      paymentUrl: checkoutUrl,
      reference,
    }
  }

  async verifyPayment(
    reference: string
  ): Promise<VerifyPaymentResponse> {
    return this.apiRequest<VerifyPaymentResponse>(
      `/reconciliation/${reference}`,
      {},
      "GET"
    )
  }

  async refundPayment(
    reference: string,
    amount: number
  ): Promise<RefundPaymentResponse> {
    return this.apiRequest<RefundPaymentResponse>("/refund", {
      reference,
      amount,
    })
  }

  async reconcilePayment(
    reference: string
  ): Promise<ReconciliationResponse> {
    return this.apiRequest<ReconciliationResponse>(
      `/reconciliation/${reference}`,
      {},
      "GET"
    )
  }
}

export const evmakClient = new EvMakClient()
export type { EvMakClient }