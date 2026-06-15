import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button-variants"
import { prisma } from "@/lib/prisma"
import type { HomepageCategory } from "@/lib/homepage"
import { CategoryGrid } from "@/components/category-grid"

export const metadata: Metadata = {
  title: "Categories — GK General Supply",
  description: "Browse our full range of product categories including generators, solar products, pumps, electrical equipment, tools, and industrial solutions.",
}

export const revalidate = 120

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      icon: true,
      _count: { select: { products: true } },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      },
    },
  })

  const homepageCategories: HomepageCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    icon: c.icon,
    productCount: c._count.products,
  }))

  return (
    <div className="container py-12">
      <div className="mb-10">
        <Badge variant="secondary" className="mb-4">Product Categories</Badge>
        <h1 className="text-4xl font-bold tracking-tight">All Categories</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Browse our complete range of industrial equipment and supplies.
        </p>
      </div>

      <CategoryGrid categories={homepageCategories} />

      <div className="mt-16 space-y-12">
        {categories.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{cat.name}</h2>
                {cat.description && (
                  <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                )}
              </div>
              <Link href={`/categories/${cat.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {cat.children.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {cat.children.map((child) => (
                  <Link key={child.id} href={`/categories/${cat.slug}?type=${child.slug}`}>
                    <Card className="h-full hover:shadow-md transition-shadow group">
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {child.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {child._count.products} product{child._count.products !== 1 ? "s" : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subcategories yet.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
