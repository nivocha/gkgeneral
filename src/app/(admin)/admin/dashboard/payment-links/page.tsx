import { requireAuth } from "@/lib/auth/session"
import { getAdminPaymentLinks } from "@/features/payments/actions/payment-links"
import { PaymentLinksTable } from "./table"

export const dynamic = "force-dynamic"

export const metadata = { title: "Payment Links | Admin" }

export default async function AdminPaymentLinksPage() {
  await requireAuth()
  const { links, total } = await getAdminPaymentLinks()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Links</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage shareable payment links ({total} total)
        </p>
      </div>
      <PaymentLinksTable links={links} />
    </div>
  )
}
