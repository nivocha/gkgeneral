import type { Metadata } from "next"
import { getCmsPage } from "@/features/cms/actions/cms-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("returns")
  if (!page) {
    return { title: "Returns & Exchanges — GK General Supply" }
  }
  return {
    title: page.metaTitle || `${page.title} — GK General Supply`,
    description: page.metaDescription || undefined,
  }
}

export default async function ReturnsPage() {
  const page = await getCmsPage("returns")

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
            <h1>Returns & Exchanges</h1>
            <p>We strive to ensure your complete satisfaction with every purchase. If you are not satisfied with your order, we are here to help.</p>
            <h2>Return Policy</h2>
            <p>Items can be returned within 14 days of delivery. Products must be unused, in original packaging, and in resalable condition.</p>
            <h2>How to Initiate a Return</h2>
            <p>Contact our customer service team to initiate a return. You will need to provide your order number and the reason for the return.</p>
            <h2>Refunds</h2>
            <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed within 5-7 business days.</p>
            <h2>Exchanges</h2>
            <p>If you received a defective or incorrect item, we will gladly exchange it. Please contact us immediately with your order details and photos of the issue.</p>
            <h2>Non-Returnable Items</h2>
            <p>Certain items such as custom orders, opened safety equipment, and perishable goods are not eligible for return unless defective.</p>
          </>
        )}
      </div>
    </div>
  )
}
