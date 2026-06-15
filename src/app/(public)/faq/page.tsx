import type { Metadata } from "next"
import { getCmsPage } from "@/features/cms/actions/cms-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("faq")
  if (!page) {
    return { title: "FAQ — GK General Supply" }
  }
  return {
    title: page.metaTitle || `${page.title} — GK General Supply`,
    description: page.metaDescription || undefined,
  }
}

export default async function FaqPage() {
  const page = await getCmsPage("faq")

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
            <h1>Frequently Asked Questions</h1>
            <h2>What products do you offer?</h2>
            <p>We offer a wide range of industrial equipment and general supplies including machinery, tools, safety equipment, and more. Browse our product catalog for our full range.</p>
            <h2>How can I place an order?</h2>
            <p>You can place an order through our website by adding items to your cart and checking out. You can also contact our sales team for assistance with bulk orders or custom requirements.</p>
            <h2>What payment methods do you accept?</h2>
            <p>We accept various payment methods including bank transfers, mobile money, and other secure payment options. Contact us for more details.</p>
            <h2>Do you offer delivery?</h2>
            <p>Yes, we offer delivery services. Delivery times and costs vary depending on your location and order size. Contact us for a delivery quote.</p>
            <h2>What is your return policy?</h2>
            <p>We have a customer-friendly return policy. Please visit our Returns page for detailed information about returns and exchanges.</p>
          </>
        )}
      </div>
    </div>
  )
}
