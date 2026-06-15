"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { searchProducts, searchAutocomplete } from "@/features/search/actions"
import { formatPrice } from "@/lib/utils"

type SearchResult = {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  sku: string
  price: number | null
  comparePrice: number | null
  currency: string
  unit: string
  tags: string[]
  category: { id: string; name: string; slug: string } | null
  brand: { id: string; name: string; slug: string } | null
  primaryImage: { url: string; alt: string | null } | null
}

type SearchResponse = {
  success: boolean
  message?: string
  items: SearchResult[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("relevance")
  const [suggestions, setSuggestions] = useState<{ name: string; slug: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const doSearch = useCallback(async (q: string, cat: string, s: string, p: number) => {
    if (!q.trim()) return
    setLoading(true)
    setShowSuggestions(false)
    const result = await searchProducts({ q, categoryId: cat || undefined, sort: s as any, page: p, pageSize: 20 })
    setResults(result)
    setLoading(false)
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false })
  }, [router])

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery, "", "relevance", 1)
    }
  }, [initialQuery, doSearch])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setResults(null)
      return
    }

    if (autocompleteRef.current) clearTimeout(autocompleteRef.current)
    autocompleteRef.current = setTimeout(async () => {
      const result = await searchAutocomplete(value)
      setSuggestions(result.suggestions)
      setShowSuggestions(result.suggestions.length > 0)
    }, 300)

    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      doSearch(value, category, sort, 1)
    }, 500)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchRef.current) clearTimeout(searchRef.current)
    if (autocompleteRef.current) clearTimeout(autocompleteRef.current)
    setShowSuggestions(false)
    doSearch(query, category, sort, 1)
  }

  const handleApplyFilters = () => {
    if (searchRef.current) clearTimeout(searchRef.current)
    doSearch(query, category, sort, 1)
    setShowFilters(false)
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Products</h1>
        <p className="text-muted-foreground">Find industrial equipment, machinery, and supplies.</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search products by name, SKU, or keyword..."
              className="pl-10 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
          </Button>
        </div>

        {showSuggestions && (
          <Card className="absolute top-full left-0 right-16 mt-1 z-50 shadow-lg">
            <CardContent className="p-2">
              {suggestions.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                  onMouseDown={() => {
                    setQuery(s.name)
                    setShowSuggestions(false)
                    doSearch(s.name, category, sort, 1)
                  }}
                >
                  {s.name}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </form>

      {showFilters && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={handleApplyFilters}>Apply Filters</Button>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.total} result{results.total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          {results.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No products found. Try a different search term.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.items.map((item) => (
                <Link key={item.id} href={`/products/${item.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {item.primaryImage ? (
                        <img
                          src={item.primaryImage.url}
                          alt={item.primaryImage.alt || item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      {item.brand && (
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.brand.name}</p>
                      )}
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{item.name}</h3>
                      {item.shortDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.shortDescription}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {item.price ? (
                          <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Contact for price</span>
                        )}
                        {item.comparePrice && (
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(item.comparePrice)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{item.sku}</Badge>
                        <span className="text-xs text-muted-foreground">per {item.unit}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {(results.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={results.page <= 1}
                onClick={() => doSearch(query, category, sort, results.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {results.page} of {results.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={results.page >= (results.totalPages ?? 1)}
                onClick={() => doSearch(query, category, sort, results.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
