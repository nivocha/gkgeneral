"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import {
  Search, Plus, Minus, Trash2, Loader2, ShoppingCart,
  ChevronLeft, Check, ExternalLink, Percent,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type ProductItem = {
  id: string
  name: string
  slug: string
  sku: string | null
  price: number
  image: string | null
}

type CartItem = {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
}

export default function AdminCreateOrderPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductItem[]>([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState("")
  const [chargeVat, setChargeVat] = useState(false)
  const [totalOverride, setTotalOverride] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{ orderId: string; orderNumber: string } | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const { searchProductsForAdmin } = await import("@/features/orders/actions/admin-create-order")
      const result = await searchProductsForAdmin(q)
      setSearchResults(result.items)
    } catch { setSearchResults([]) }
    setSearching(false)
  }, [])

  const onSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku || "",
        price: product.price,
        quantity: 1,
      }]
    })
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) return
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i))
  }

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const vatAmount = chargeVat ? Math.round(subtotal * 0.18 * 100) / 100 : 0
  const totalOverrideNum = totalOverride ? parseFloat(totalOverride) : 0
  const displayTotal = totalOverrideNum > 0 ? totalOverrideNum : Math.round((subtotal + vatAmount) * 100) / 100

  async function handleCreateOrder() {
    if (cart.length === 0) { toast.error("Add at least one product"); return }
    if (totalOverrideNum > 0 && !adjustmentReason.trim()) {
      toast.error("Please provide an adjustment reason when overriding the total"); return
    }

    setSubmitting(true)
    try {
      const { createAdminOrder } = await import("@/features/orders/actions/admin-create-order")
      const result = await createAdminOrder({
        chargeVat,
        totalOverride: totalOverrideNum > 0 ? totalOverrideNum : undefined,
        adjustmentReason: adjustmentReason.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku || undefined,
          price: i.price,
          quantity: i.quantity,
        })),
      })
      if (!result.success) {
        toast.error(result.message)
        setSubmitting(false)
        return
      }
      setOrderResult({ orderId: result.data!.orderId, orderNumber: result.data!.orderNumber })
      toast.success("Order created!")
    } catch (e: any) {
      toast.error(e?.message || "Failed to create order")
    }
    setSubmitting(false)
  }

  async function handleGenerateLink() {
    if (!orderResult) return
    setGeneratingLink(true)
    try {
      const { generatePaymentLink } = await import("@/features/payments/actions/payment-links")
      await generatePaymentLink(orderResult.orderId)
      toast.success("Payment link generated!")
      router.push(`/admin/dashboard/orders/${orderResult.orderId}`)
    } catch { toast.error("Failed to generate payment link") }
    setGeneratingLink(false)
  }

  if (orderResult) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Order Created Successfully</h2>
          <p className="text-2xl font-bold text-primary mb-6 font-mono">{orderResult.orderNumber}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleGenerateLink} disabled={generatingLink}>
              {generatingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              Generate Payment Link
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/dashboard/orders/${orderResult.orderId}`)}>
              View Order
            </Button>
            <Button variant="ghost" onClick={() => { setOrderResult(null); setCart([]); setSearchQuery(""); setSearchResults([]); setChargeVat(false); setTotalOverride(""); setAdjustmentReason("") }}>
              Create Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/dashboard/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <h1 className="text-3xl font-bold">Create Order</h1>
        <p className="text-muted-foreground mt-1">Search products, add to cart, and create an order.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name or SKU..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              {searching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searching && searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border rounded-md hover:border-primary cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku || "—"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">No products found</p>
              )}
              {!searching && searchQuery.length < 2 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">Type at least 2 characters to search</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Cart is empty. Search and add products.</p>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium w-16 text-right">{formatPrice(item.price * item.quantity)}</p>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.productId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <Switch
                    id="chargeVat"
                    checked={chargeVat}
                    onCheckedChange={(v) => setChargeVat(v)}
                    disabled={totalOverrideNum > 0}
                  />
                  <Label htmlFor="chargeVat" className="text-sm cursor-pointer">Purchasing as Business (VAT 18%)</Label>
                </div>
                {chargeVat && (
                  <div className="flex justify-between pl-6">
                    <span className="text-muted-foreground">VAT (18%)</span>
                    <span>{formatPrice(vatAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-2 pt-1">
                  <Label className="text-xs text-muted-foreground">Total Override (optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave blank to auto-calculate"
                    value={totalOverride}
                    onChange={(e) => setTotalOverride(e.target.value)}
                  />
                </div>
                {totalOverrideNum > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Adjustment Reason</Label>
                    <Input
                      placeholder="e.g. Discount, surcharge..."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                    />
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{displayTotal > 0 ? formatPrice(displayTotal) : "—"}</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Order notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <Button className="w-full mt-4" size="lg" onClick={handleCreateOrder} disabled={submitting || cart.length === 0}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? "Creating..." : "Create Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
