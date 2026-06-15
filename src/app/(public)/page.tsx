import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Phone, CheckCircle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/config"
import { getHomepageData, buildHeroSlides } from "@/lib/homepage"
import { getHomepageContent } from "@/features/homepage/actions/get-homepage-content"
import { HeroSection } from "@/components/hero-section"
import { CategoryGrid } from "@/components/category-grid"
import { FeaturedProducts } from "@/components/featured-products"
import { TrendingProducts } from "@/components/trending-products"
import { BrandShowcase } from "@/components/brand-showcase"
import { TestimonialSection } from "@/components/testimonial-section"
import { StatisticsSection } from "@/components/statistics-section"

export const revalidate = 120

export const metadata: Metadata = {
  title: siteConfig.name,
  description:
    "Tanzania's premier supplier of generators, solar systems, pumps, electrical equipment, and industrial machinery. Quality assured with nationwide delivery.",
  openGraph: {
    title: siteConfig.name,
    description:
      "Tanzania's premier supplier of generators, solar systems, pumps, electrical equipment, and industrial machinery.",
    siteName: siteConfig.name,
    type: "website",
  },
}

export default async function HomePage() {
  const [data, cms] = await Promise.all([
    getHomepageData(),
    getHomepageContent(),
  ])
  const heroSlides = buildHeroSlides(data.featuredProducts)
  const promo = cms.promotions[0]

  return (
    <>
      <HeroSection slides={heroSlides} />

      <CategoryGrid categories={data.categories} />

      <FeaturedProducts products={data.featuredProducts} />

      <TrendingProducts products={data.trendingProducts} />

      <BrandShowcase brands={data.brands} />

      {/* Promotions / Solutions */}
      {promo && (
        <section className="container py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            {promo.badge && <Badge variant="secondary" className="mb-4">{promo.badge}</Badge>}
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{promo.title}</h2>
            {promo.description && (
              <p className="text-muted-foreground mt-3 text-lg">{promo.description}</p>
            )}
          </div>
          {promo.linkUrl && (
            <div className="text-center">
              <Link
                href={promo.linkUrl}
                className={buttonVariants({ size: "lg" })}
              >
                {promo.linkText || "Learn More"} <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* More promotions grid if multiple */}
      {cms.promotions.length > 1 && (
        <section className="container pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cms.promotions.slice(1).map((p) => (
              <Card key={p.id} className="overflow-hidden group hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mb-4">{p.description}</p>}
                  {p.linkUrl && (
                    <Link href={p.linkUrl} className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
                      {p.linkText || "Learn more"} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <TestimonialSection testimonials={cms.testimonials} />

      <StatisticsSection statistics={cms.statistics} />

      {/* CTA */}
      <section className="container py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 lg:p-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
              >
                Get Started Today
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight">
                Need a Custom Quote?
              </h2>
              <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-lg">
                Contact our sales team for bulk orders, custom specifications,
                and competitive pricing on all industrial equipment. We respond
                within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-secondary text-secondary-foreground px-8 py-3 text-base font-medium shadow-sm hover:bg-secondary/80 gap-2"
                >
                  Request a Quote <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="tel:+255700000000"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-primary-foreground/20 text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2"
                >
                  <Phone className="h-4 w-4" /> Call Us
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {cms.statistics.length > 0 ? cms.statistics.slice(0, 4).map((s) => (
                  <div key={s.id} className="rounded-xl bg-primary-foreground/10 p-4 text-center backdrop-blur-sm">
                    <p className="text-2xl font-bold text-primary-foreground">
                      {s.prefix}{s.value}{s.suffix}
                    </p>
                    <p className="text-xs text-primary-foreground/70 mt-1">{s.label}</p>
                  </div>
                )) : [
                  { label: "Products Available", value: "10,000+" },
                  { label: "Happy Clients", value: "500+" },
                  { label: "Years Experience", value: "15+" },
                  { label: "Cities Covered", value: "26+" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-primary-foreground/10 p-4 text-center backdrop-blur-sm">
                    <p className="text-2xl font-bold text-primary-foreground">{s.value}</p>
                    <p className="text-xs text-primary-foreground/70 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
