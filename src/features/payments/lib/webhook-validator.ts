import crypto from "crypto"

const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000

export type WebhookPayload = {
  event: string
  reference: string
  status: string
  amount: number
  currency: string
  timestamp: number
  nonce: string
  signature: string
  transaction_reference?: string
  approval_code?: string
  card_type?: string
  card_masked?: string
  payment_id?: string
  gateway_status?: string
  metadata?: Record<string, unknown>
}

export function verifyWebhookSignature(
  payload: WebhookPayload
): boolean {
  const secret = process.env.EVMAK_WEBHOOK_SECRET
  if (!secret) return false

  const { signature, ...data } = payload
  const message = [
    data.event,
    data.reference,
    data.status,
    data.amount.toString(),
    data.currency,
    data.timestamp.toString(),
    data.nonce,
  ].join("|")

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature)
  )
}

export function validateWebhookTimestamp(timestamp: number): boolean {
  return Math.abs(Date.now() - timestamp) <= MAX_TIMESTAMP_AGE_MS
}
