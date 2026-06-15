import type { Metadata } from "next"
import { getRevenueAnalytics, getProductAnalytics, getCustomerAnalytics } from "@/features/analytics/actions"
import { AnalyticsClient } from "./analytics-client"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Revenue, product, and customer analytics.",
}

export default async function AnalyticsPage() {
  const [revenue, products, customers] = await Promise.all([
    getRevenueAnalytics().catch(() => null),
    getProductAnalytics().catch(() => null),
    getCustomerAnalytics().catch(() => null),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Revenue, product, and customer insights.</p>
      </div>
      <AnalyticsClient revenue={revenue} products={products} customers={customers} />
    </div>
  )
}
