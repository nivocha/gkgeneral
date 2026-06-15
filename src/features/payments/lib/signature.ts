import crypto from "crypto"

export type SignatureConfig = {
  clientId: string
  clientSecret: string
}

function getSignatureConfig(): SignatureConfig {
  const clientId = process.env.EVMAK_CLIENT_ID
  const clientSecret = process.env.EVMAK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("EVMAK_CLIENT_ID and EVMAK_CLIENT_SECRET must be set")
  }
  return { clientId, clientSecret }
}

export function createOutboundSignature(timestamp: string): {
  signature: string
  clientId: string
} {
  const { clientId, clientSecret } = getSignatureConfig()
  const message = `${clientId}|${timestamp}`
  const signature = crypto
    .createHmac("sha256", clientSecret)
    .update(message)
    .digest("hex")
  return { signature, clientId }
}

export function createCheckoutSignature(base64Payload: string): string {
  const { clientSecret } = getSignatureConfig()
  return crypto
    .createHmac("sha256", clientSecret)
    .update(base64Payload)
    .digest("hex")
}

export function verifyInboundSignature(
  receivedSignature: string,
  clientId: string,
  timestamp: string,
  clientSecret: string
): boolean {
  const message = `${clientId}|${timestamp}`
  const expectedSig = crypto
    .createHmac("sha256", clientSecret)
    .update(message)
    .digest("hex")
  if (expectedSig.length !== receivedSignature.length) return false
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(receivedSignature)
  )
}

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

export function validateTimestamp(timestamp: string): boolean {
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return false
  return Math.abs(Date.now() - ts * 1000) <= MAX_CLOCK_SKEW_MS
}

export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString()
}

export function generateNonce(): string {
  return crypto.randomUUID()
}

export function base64Encode(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

export function base64Decode<T>(encoded: string): T {
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf-8")) as T
}
