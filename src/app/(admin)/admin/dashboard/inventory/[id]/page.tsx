import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getInventoryById, adjustInventory, transferInventory } from "@/features/inventory/actions/inventory"
import { getWarehouses } from "@/features/inventory/actions/warehouse"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockLevelBadge } from "@/features/inventory/components/inventory-status-badge"
import { MovementHistoryTable } from "@/features/inventory/components/movement-history-table"
import { formatPrice, formatDateTime } from "@/lib/utils"
import { ChevronLeft, Package } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = { title: "Inventory Detail | Admin" }

type Props = { params: Promise<{ id: string }> }

async function handleAdjust(formData: FormData) {
  "use server"
  const inventoryId = formData.get("inventoryId") as string
  const type = formData.get("type") as string
  const quantity = parseInt(formData.get("quantity") as string, 10)
  const note = formData.get("note") as string | null
  await adjustInventory({ inventoryId, type: type as any, quantity, note: note ?? undefined })
}

async function handleTransfer(formData: FormData) {
  "use server"
  const inventoryId = formData.get("inventoryId") as string
  const toWarehouseId = formData.get("toWarehouseId") as string
  const quantity = parseInt(formData.get("quantity") as string, 10)
  const note = formData.get("note") as string | null
  await transferInventory({ inventoryId, toWarehouseId, quantity, note: note ?? undefined })
}

export default async function InventoryDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getInventoryById(id)
  if (!result.success) notFound()
  const inv = result.data!
  const available = inv.availableQuantity as number

  const warehousesResult = await getWarehouses({ pageSize: 100 })
  const otherWarehouses = warehousesResult.items.filter((w: { id: string }) => w.id !== inv.warehouse.id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/dashboard/inventory" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Inventory
        </Link>
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">{inv.product.name}</h1>
            <p className="text-muted-foreground text-sm">SKU: {inv.product.sku} · {inv.warehouse.name}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Stock Levels</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{inv.quantity}</p>
                  <p className="text-xs text-muted-foreground">On Hand</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{inv.reservedQuantity}</p>
                  <p className="text-xs text-muted-foreground">Reserved</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className={`text-2xl font-bold ${available <= 0 ? "text-red-600" : available <= inv.minStockLevel ? "text-amber-600" : "text-green-600"}`}>
                    {available}
                  </p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{inv.minStockLevel}</p>
                  <p className="text-xs text-muted-foreground">Min Level</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <StockLevelBadge available={available} minStockLevel={inv.minStockLevel} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Movements</CardTitle></CardHeader>
            <CardContent>
              <MovementHistoryTable items={inv.movements as any} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{inv.product.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SKU</span><span className="font-mono">{inv.product.sku}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span>{formatPrice(inv.product.price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span>{inv.product.unit}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Warehouse</span><span>{inv.warehouse.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{inv.warehouse.location ?? "—"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Stock Adjustment</CardTitle></CardHeader>
            <CardContent>
              <form action={handleAdjust} className="space-y-3">
                <input type="hidden" name="inventoryId" value={inv.id} />
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Type</label>
                  <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="STOCK_IN">Stock In</option>
                    <option value="STOCK_OUT">Stock Out</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Quantity</label>
                  <input name="quantity" type="number" min="1" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Note</label>
                  <input name="note" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Reason for adjustment" />
                </div>
                <Button type="submit" variant="outline" className="w-full">Apply Adjustment</Button>
              </form>
            </CardContent>
          </Card>

          {otherWarehouses.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Transfer to Warehouse</CardTitle></CardHeader>
              <CardContent>
                <form action={handleTransfer} className="space-y-3">
                  <input type="hidden" name="inventoryId" value={inv.id} />
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Destination</label>
                    <select name="toWarehouseId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select warehouse...</option>
                      {otherWarehouses.map((w: { id: string; name: string }) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Quantity</label>
                    <input name="quantity" type="number" min="1" max={available} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Note</label>
                    <input name="note" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Transfer reason" />
                  </div>
                  <Button type="submit" variant="default" className="w-full">Transfer Stock</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
