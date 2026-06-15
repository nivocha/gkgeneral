"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProductCard, ProductCardSkeleton } from "@/features/products/components/product-card"
import { useProducts } from "@/features/products/queries"

type Props = {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    parentId: string | null
  }
  type: string | null
  typeName: string | null
  typeId: string | null
}

export function CategoryDetailContent({ category, type, typeName, typeId }: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useProducts({
    category: typeId || category.id,
    search: search || undefined,
    sort,
    page,
    pageSize: 12,
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{category.name}</h1>
              {type && <Badge variant="secondary">{typeName || type}</Badge>}
            </div>
            {category.description && (
              <p className="text-muted-foreground mt-1">{category.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {data?.total || 0} product{(data?.total || 0) !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${category.name.toLowerCase()}...`}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name_asc">Name: A-Z</SelectItem>
              <SelectItem value="name_desc">Name: Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: data.totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found in this category.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
