import { notFound } from "next/navigation"
import Link from "next/link"
import { getWarehouseById, toggleWarehouseActive } from "@/features/inventory/actions/warehouse"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"
import { ChevronLeft, Edit3, Building2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = { title: "Warehouse Detail | Admin" }

type Props = { params: Promise<{ id: string }> }

async function handleToggle(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  const isActive = formData.get("isActive") === "true"
  await toggleWarehouseActive(id, !isActive)
}

export default async function WarehouseDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getWarehouseById(id)
  if (!result.success) notFound()
  const warehouse = result.data!

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/dashboard/warehouses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Warehouses
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">{warehouse.name}</h1>
              <p className="text-muted-foreground text-sm">{warehouse.location ?? "No location set"}</p>
            </div>
          </div>
          <Badge variant={warehouse.isActive ? "default" : "secondary"}>
            {warehouse.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Warehouse Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{warehouse.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{warehouse.location ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={warehouse.isActive ? "default" : "secondary"}>{warehouse.isActive ? "Active" : "Inactive"}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDateTime(warehouse.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span>{formatDateTime(warehouse.updatedAt)}</span></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory Items</span>
                <span className="font-mono">{warehouse._count.inventories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Movements</span>
                <span className="font-mono">{warehouse._count.movements}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Link href={`/admin/dashboard/warehouses/${warehouse.id}/edit`}>
              <Button variant="outline" className="w-full"><Edit3 className="h-4 w-4 mr-2" /> Edit Warehouse</Button>
            </Link>
            <form action={handleToggle}>
              <input type="hidden" name="id" value={warehouse.id} />
              <input type="hidden" name="isActive" value={String(warehouse.isActive)} />
              <Button variant={warehouse.isActive ? "secondary" : "default"} className="w-full" type="submit">
                {warehouse.isActive ? "Deactivate" : "Activate"} Warehouse
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
