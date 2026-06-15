import type { Metadata } from "next"
import { getCmsPage } from "@/features/cms/actions/cms-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("shipping")
  if (!page) {
    return { title: "Shipping Information — GK General Supply" }
  }
  return {
    title: page.metaTitle || `${page.title} — GK General Supply`,
    description: page.metaDescription || undefined,
  }
}

export default async function ShippingPage() {
  const page = await getCmsPage("shipping")

  return (
    <div className="container py-12 lg:py-16">
      <div className="prose prose-gray max-w-3xl mx-auto">
        {page ? (
          <>
            <h1>{page.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </>
        ) : (
          <>
            <h1>Shipping Information</h1>
            <p>We offer reliable shipping services to ensure your orders reach you in a timely manner.</p>
            <h2>Delivery Areas</h2>
            <p>We deliver across Tanzania, including Dar es Salaam, Arusha, Mwanza, Mbeya, and other major regions. Contact us to confirm delivery to your specific location.</p>
            <h2>Shipping Costs</h2>
            <p>Shipping costs are calculated based on the order weight, dimensions, and delivery location. You will see the shipping cost at checkout before confirming your order.</p>
            <h2>Delivery Timeframes</h2>
            <p>Standard delivery typically takes 2-5 business days within major cities. Rural areas may take longer. Expedited shipping options are available upon request.</p>
            <h2>Order Tracking</h2>
            <p>Once your order is shipped, you will receive a tracking number via email or SMS to monitor your delivery status.</p>
          </>
        )}
      </div>
    </div>
  )
}
