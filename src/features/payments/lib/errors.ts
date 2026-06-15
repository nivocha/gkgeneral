export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "PaymentError"
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerStatusCode?: number,
    public readonly providerBody?: string
  ) {
    super(message)
    this.name = "ProviderError"
  }
}

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof PaymentError) {
    return error.message
  }
  if (error instanceof ProviderError) {
    return "Payment provider error. Please try again later."
  }
  return "An unexpected error occurred. Please try again."
}

export function mapProviderError(status: number): string {
  if (status >= 500) return "Payment provider is not responding. Please try again later."
  if (status === 401 || status === 403) return "Payment provider authentication failed."
  if (status === 404) return "Payment reference not found on provider."
  if (status === 429) return "Too many requests to payment provider. Please try again."
  return "Payment request failed. Please try again."
}
