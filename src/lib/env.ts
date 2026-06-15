const REQUIRED_ENV_VARS = [
  "EVMAK_CLIENT_ID",
  "EVMAK_CLIENT_SECRET",
  "EVMAK_API_URL",
] as const

const OPTIONAL_ENV_VARS = [
  "EVMAK_MNO_USERNAME",
  "EVMAK_RECON_ENABLED",
  "EVMAK_MNO_API_URL",
] as const

function getEnvVar(name: string): string | undefined {
  return process.env[name]
}

export function validatePaymentEnv(): {
  valid: boolean
  missing: string[]
} {
  const missing: string[] = []
  for (const name of REQUIRED_ENV_VARS) {
    if (!getEnvVar(name)) {
      missing.push(name)
    }
  }
  return { valid: missing.length === 0, missing }
}

export function getPaymentEnv(): {
  clientId: string
  clientSecret: string
  webhookSecret: string
  apiUrl: string
  mnoUsername: string | undefined
  reconEnabled: boolean
  mnoApiUrl: string | undefined
} {
  const clientId = getEnvVar("EVMAK_CLIENT_ID") ?? ""
  const clientSecret = getEnvVar("EVMAK_CLIENT_SECRET") ?? ""
  const webhookSecret = getEnvVar("EVMAK_WEBHOOK_SECRET") ?? ""
  const apiUrl = getEnvVar("EVMAK_API_URL") ?? ""
  const mnoUsername = getEnvVar("EVMAK_MNO_USERNAME")
  const reconEnabled = getEnvVar("EVMAK_RECON_ENABLED") !== "false"
  const mnoApiUrl = getEnvVar("EVMAK_MNO_API_URL")

  return {
    clientId,
    clientSecret,
    webhookSecret,
    apiUrl,
    mnoUsername,
    reconEnabled,
    mnoApiUrl,
  }
}

export function isPaymentsConfigured(): boolean {
  const { valid } = validatePaymentEnv()
  return valid
}
