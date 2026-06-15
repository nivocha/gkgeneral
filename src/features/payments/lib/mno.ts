import crypto from "crypto"
import { getPaymentEnv } from "@/lib/env"
import { ProviderError } from "@/features/payments/lib/errors"
import { generateNonce } from "@/features/payments/lib/signature"

export type MnoProvider = "mpesa" | "tigo_pesa" | "airtel_money" | "halopesa"

export type MnoPaymentRequest = {
  api_source: string
  api_to: string
  amount: number
  product: string
  callback: string
  hash: string
  user: string
  mobileNo: string
  reference: string
  callbackstatus?: string
}

export type MnoPaymentResponse = {
  success: boolean
  transaction_id?: string
  reference: string
  message?: string
  status?: string
  order_id?: string
  amount?: number
  response_code?: number
  response_desc?: string
}

export type MnoVerifyResponse = {
  success: boolean
  status: string
  reference: string
  transaction_id?: string
  message?: string
}

const MNO_WALLET_NAMES: Record<MnoProvider, string> = {
  mpesa: "Mpesa",
  tigo_pesa: "TigoPesa",
  airtel_money: "AirtelMoney",
  halopesa: "HaloPesa",
}

function formatDateDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export function getMnoWalletName(provider: MnoProvider): string {
  return MNO_WALLET_NAMES[provider]
}

export function generateMnoHash(dateStr: string): string {
  const username = getPaymentEnv().mnoUsername || ""
  return crypto.createHash("md5").update(`${username}|${dateStr}`).digest("hex")
}

function getMnoApiUrl(): string {
  const base = getPaymentEnv().mnoApiUrl || `${getPaymentEnv().apiUrl}/mno`
  return base.endsWith("/") ? base : `${base}/`
}

function cleanPhoneForMno(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "").replace(/^0+/, "")
  if (cleaned.startsWith("255")) return cleaned
  return "255" + cleaned
}

export async function createMnoPayment(
  params: {
    provider: MnoProvider
    amount: number
    phoneNumber: string
    reference: string
    callbackUrl: string
  }
): Promise<MnoPaymentResponse> {
  const { mnoUsername } = getPaymentEnv()
  if (!mnoUsername) {
    throw new Error("EVMAK_MNO_USERNAME is required for MNO payments")
  }

  const today = formatDateDDMMYYYY(new Date())
  const hash = generateMnoHash(today)

  const body: MnoPaymentRequest = {
    api_source: process.env.NEXT_PUBLIC_APP_NAME || "GK_SUPPLY",
    api_to: getMnoWalletName(params.provider),
    amount: params.amount,
    product: "GK_SUPPLY",
    callback: params.callbackUrl,
    hash,
    user: mnoUsername,
    mobileNo: cleanPhoneForMno(params.phoneNumber),
    reference: params.reference,
    callbackstatus: "Success",
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(getMnoApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new ProviderError(
        `MNO API returned ${response.status}`,
        response.status,
        errorBody
      )
    }

    return (await response.json()) as MnoPaymentResponse
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof ProviderError) throw error
    throw new ProviderError("MNO payment request failed")
  }
}

export async function verifyMnoPayment(
  reference: string
): Promise<MnoVerifyResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `${getMnoApiUrl()}/payment/${reference}/status`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new ProviderError(
        `MNO verify returned ${response.status}`,
        response.status
      )
    }

    return (await response.json()) as MnoVerifyResponse
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof ProviderError) throw error
    throw new ProviderError("MNO verification failed")
  }
}

export function generateMnoReference(): string {
  return `MNO-${generateNonce().slice(0, 8).toUpperCase()}`
}