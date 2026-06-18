export const DEFAULT_CURRENCY = "USD"
export const DEFAULT_LOCALE = "en-US"

type CurrencyConfig = {
  symbol: string
  code: string
  name: string
  locale: string
}

const currencyMap: Record<string, CurrencyConfig> = {
  USD: { symbol: "$", code: "USD", name: "US Dollar", locale: "en-US" },
  TZS: { symbol: "TSh", code: "TZS", name: "Tanzanian Shilling", locale: "en-TZ" },
  KES: { symbol: "KSh", code: "KES", name: "Kenyan Shilling", locale: "en-KE" },
  EUR: { symbol: "€", code: "EUR", name: "Euro", locale: "en-DE" },
}

export function getCurrencyConfig(currency?: string | null): CurrencyConfig {
  return currencyMap[currency || DEFAULT_CURRENCY] || currencyMap[DEFAULT_CURRENCY]
}

export function getCurrencySymbol(currency?: string | null): string {
  return getCurrencyConfig(currency).symbol
}

export function formatPrice(price: number, currency?: string | null): string {
  const config = getCurrencyConfig(currency)
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}
