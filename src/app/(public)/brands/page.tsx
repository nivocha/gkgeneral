import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPublicBrands } from "@/features/brands/actions/get-brands"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Brands | GK General Supply",
  description: "Browse our trusted industrial equipment brands and manufacturers.",
}

export default async function BrandsPage() {
  const brands = await getPublicBrands()

  if (brands.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Brands</h1>
        <p className="text-muted-foreground">No brands available yet.</p>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Our Brands</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Partnering with world-class manufacturers to bring you quality industrial equipment.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group rounded-xl border p-6 hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-12 w-12 object-contain rounded" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{brand.name}</h2>
                {brand.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{brand.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {brand._count.products} product{brand._count.products !== 1 ? "s" : ""}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
