import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Zap, Sun, Droplets, Cable, Wrench, Factory,
  ArrowRight, ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { HomepageCategory } from "@/lib/homepage"

const categoryStyles: Record<string, {
  icon: LucideIcon; gradient: string; iconBg: string
}> = {
  generators: {
    icon: Zap,
    gradient: "from-amber-500/20 to-orange-500/10",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  solar: {
    icon: Sun,
    gradient: "from-yellow-500/20 to-amber-500/10",
    iconBg: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  },
  pumps: {
    icon: Droplets,
    gradient: "from-blue-500/20 to-cyan-500/10",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  electrical: {
    icon: Cable,
    gradient: "from-red-500/20 to-rose-500/10",
    iconBg: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  tools: {
    icon: Wrench,
    gradient: "from-emerald-500/20 to-green-500/10",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  industrial: {
    icon: Factory,
    gradient: "from-violet-500/20 to-purple-500/10",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
}

const defaultStyle = {
  icon: Factory,
  gradient: "from-primary/20 to-primary/10",
  iconBg: "bg-primary/15 text-primary",
}

export function CategoryGrid({ categories }: { categories: HomepageCategory[] }) {
  if (categories.length === 0) return null

  return (
    <section className="container py-20 lg:py-28">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-12">
        <div>
          <Badge variant="secondary" className="mb-4">
            Product Categories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Shop by Category
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Explore our comprehensive range of industrial products across our categories.
          </p>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground gap-2 flex-shrink-0"
        >
          View All Categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {categories.map((cat) => {
          const style = categoryStyles[cat.slug] || defaultStyle
          const Icon = style.icon
          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group"
            >
              <Card className="overflow-hidden border-0 bg-gradient-to-br shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${style.gradient} p-6 lg:p-8`}>
                    <div
                      className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center mb-4`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cat.description || `${cat.name} equipment and supplies`}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
