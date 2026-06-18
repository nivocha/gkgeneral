"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search, Plus, ChevronDown, ArrowUpDown, Trash2, Edit,
  Eye, MoreHorizontal, CheckCircle2, XCircle, Clock,
  AlertTriangle, Download, Image, Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/currency"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const statusConfig = {
  Draft: { icon: Clock, class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  Active: { icon: CheckCircle2, class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  Archived: { icon: XCircle, class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  OutOfStock: { icon: AlertTriangle, class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  brand: string | null
  status: "Draft" | "Active" | "Archived" | "OutOfStock"
  isFeatured: boolean
  price: number | null
  comparePrice: number | null
  stockQuantity: number
  minStockLevel: number
  currency: string
  createdAt: Date
  category: { id: string; name: string; slug: string } | null
  primaryImage: { url: string; alt: string | null } | null
  variantCount: number
  imageCount: number
}

interface Props {
  products: Product[]
  total: number
  page: number
  totalPages: number
  categories: { id: string; name: string; slug: string }[]
}

export function ProductsListClient({ products, total, page, totalPages, categories }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      if (updates.search !== undefined) params.set("page", "1")
      router.push(`/admin/dashboard/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search })
  }

  const handleSort = (sort: string) => {
    updateParams({ sort })
  }

  const handleBulkDelete = async () => {
    const { bulkDeleteProducts } = await import("@/features/products/actions/prisma")
    const result = await bulkDeleteProducts(selected)
    if (result.success) {
      setSelected([])
      setBulkDeleteDialog(false)
      router.refresh()
    }
  }

  const handleBulkStatus = async (status: string) => {
    const { bulkUpdateStatus } = await import("@/features/products/actions/prisma")
    const result = await bulkUpdateStatus(selected, status as any)
    if (result.success) {
      setSelected([])
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    const { deleteProduct } = await import("@/features/products/actions/prisma")
    const result = await deleteProduct(id)
    if (result.success) {
      setDeleteDialog(null)
      router.refresh()
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === products.length) setSelected([])
    else setSelected(products.map((p) => p.id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">{total} products total</p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/products/new">
            <Plus className="h-4 w-4 mr-2" /> New Product
          </Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Select
          value={searchParams.get("status") || "all"}
          onValueChange={(v) => updateParams({ status: v === "all" ? "" : v, page: "1" })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
            <SelectItem value="OutOfStock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("category") || "all"}
          onValueChange={(v) => updateParams({ category: v === "all" ? "" : v, page: "1" })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("sort") || "newest"}
          onValueChange={handleSort}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name_asc">Name A-Z</SelectItem>
            <SelectItem value="name_desc">Name Z-A</SelectItem>
            <SelectItem value="price_asc">Price Low</SelectItem>
            <SelectItem value="price_desc">Price High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <div className="flex-1" />
          <Select onValueChange={handleBulkStatus}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Set Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
              <SelectItem value="OutOfStock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialog(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selected.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">SKU</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  No products found
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const StatusIcon = statusConfig[product.status].icon
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.primaryImage ? (
                          <img
                            src={product.primaryImage.url}
                            alt={product.primaryImage.alt || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/dashboard/products/${product.id}/edit`}
                          className="font-medium text-sm hover:text-primary truncate block max-w-[200px]"
                        >
                          {product.name}
                        </Link>
                        {product.brand && (
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {product.isFeatured && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              Featured
                            </Badge>
                          )}
                          {product.variantCount > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {product.variantCount} variants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {product.sku}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {product.category?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      statusConfig[product.status].class
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {product.status === "OutOfStock" ? "Out of Stock" : product.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className={cn(
                      "text-xs font-medium",
                      product.stockQuantity <= product.minStockLevel
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}>
                      {product.stockQuantity} / {product.minStockLevel} min
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium">
                      {product.price != null
                        ? formatPrice(Number(product.price), product.currency)
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/dashboard/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteDialog(product.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} results)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, page - 2)
              const p = start + i
              if (p > totalPages) return null
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => updateParams({ page: String(p) })}
                >
                  {p}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              This will soft-delete the product. It can be recovered later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete</DialogTitle>
            <DialogDescription>
              Delete {selected.length} products? This action is reversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selected.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ProductsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="rounded-md border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
            <Skeleton className="h-3 w-20 hidden md:block" />
            <Skeleton className="h-3 w-24 hidden md:block" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-16 hidden lg:block" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}
