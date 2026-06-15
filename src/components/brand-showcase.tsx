import { Badge } from "@/components/ui/badge"
import type { HomepageBrand } from "@/lib/homepage"

export function BrandShowcase({ brands }: { brands: HomepageBrand[] }) {
  if (brands.length === 0) return null

  return (
    <section className="bg-muted/30 py-16 lg:py-20">
      <div className="container">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            Trusted Manufacturers
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            World-Class Brands We Represent
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 lg:gap-8">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center h-16 lg:h-20 rounded-lg border bg-muted/30 px-4 hover:border-primary/30 hover:bg-muted/50 transition-all cursor-default"
            >
              <span className="text-sm lg:text-base font-bold text-muted-foreground/60 whitespace-nowrap">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
