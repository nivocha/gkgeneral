import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInHours } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatPrice, DEFAULT_CURRENCY, getCurrencySymbol, getCurrencyConfig } from "@/lib/currency"

export function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  return format(new Date(date), "MMM dd, yyyy")
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-"
  return format(new Date(date), "MMM dd, yyyy HH:mm")
}

export function timeAgo(date: Date | string | null): string {
  if (!date) return "-"
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function relativeTime(date: Date | string | null): string {
  if (!date) return "-"
  const d = new Date(date)
  const hours = differenceInHours(new Date(), d)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  return formatDistanceToNow(d, { addSuffix: true })
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateSKU(category: string, name: string, id: string): string {
  const prefix = category.slice(0, 3).toUpperCase()
  const namePart = name.slice(0, 4).toUpperCase()
  const idPart = id.slice(-6).toUpperCase()
  return `${prefix}-${namePart}-${idPart}`
}

export function generateOrderNumber(id: string): string {
  const date = new Date()
  const yy = date.getFullYear().toString().slice(-2)
  const mm = (date.getMonth() + 1).toString().padStart(2, "0")
  const dd = date.getDate().toString().padStart(2, "0")
  const seq = id.slice(-6).toUpperCase()
  return `GK-${yy}${mm}${dd}-${seq}`
}

export function parseSearchParams(params: Record<string, string | string[] | undefined>) {
  const searchParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams[key] = Array.isArray(value) ? value[0] : value
    }
  }
  return searchParams
}

export function buildQueryString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value)
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@")
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}@${domain}`
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return "http://localhost:3000"
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
