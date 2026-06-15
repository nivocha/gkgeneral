import type { Metadata } from "next"
import { getCmsPage } from "@/features/cms/actions/cms-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("about")
  if (!page) {
    return { title: "About Us — GK General Supply" }
  }
  return {
    title: page.metaTitle || `${page.title} — GK General Supply`,
    description: page.metaDescription || undefined,
  }
}

export default async function AboutPage() {
  const page = await getCmsPage("about")

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
            <h1>About Us</h1>
            <p>We are GK General Supply, your trusted partner for industrial equipment and general supplies. With years of experience in the industry, we provide high-quality products and exceptional service to our customers.</p>
            <p>Our team is dedicated to sourcing and delivering the best industrial solutions to meet your needs. We pride ourselves on our extensive product range, competitive pricing, and reliable customer support.</p>
            <p>Contact us today to learn more about how we can help your business succeed.</p>
          </>
        )}
      </div>
    </div>
  )
}
