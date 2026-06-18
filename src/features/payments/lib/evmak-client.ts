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
  returnUrl: string
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
    buildingNumber?: string | null
  }
}

export type InitializePaymentResponse = {
  success: boolean
  paymentUrl: string
  reference: string
  message?: string
}

export type VerifyPaymentResponse = ReconciliationResponse

export type RefundPaymentResponse = {
  success: boolean
  reference: string
  transactionReference?: string
  message?: string
}

export type ReconciliationData = {
  reference: string
  status: string
  amount: string
  currency: string
  payment_id?: string
  card_number?: string
  card_type?: string
  approval_code?: string
  authorized_at?: string
  message?: string | null
}

export type ReconciliationResponse = {
  status: "success" | "error"
  data?: ReconciliationData
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
    const { apiUrl, clientId } = getPaymentEnv()
    return `${apiUrl}/checkout/${clientId}`
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
    const evmakCurrency = "TZS"
    const evmakAmount = params.currency === "TZS"
      ? params.amount
      : Math.round(params.amount * 2500)
    const payload: Record<string, string> = {
      total: evmakAmount.toFixed(2),
      currency: evmakCurrency,
      reference,
      country: "TZ",
      firstName: params.customerFirstName,
      lastName: params.customerLastName,
      email: params.customerEmail,
      phoneNumber: phoneNumber || "",
      address1: addr?.street || "N/A",
      buildingNumber: addr?.buildingNumber || "1",
      locality: addr?.city || "Dar es Salaam",
      administrativeArea: addr?.state || addr?.city || "Dar es Salaam",
      postalCode: addr?.zipCode || "10000",
      returnUrl: params.returnUrl,
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