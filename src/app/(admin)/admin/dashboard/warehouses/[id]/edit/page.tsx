import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getWarehouseById, updateWarehouse } from "@/features/inventory/actions/warehouse"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = { title: "Edit Warehouse | Admin" }

type Props = { params: Promise<{ id: string }> }

async function handleEdit(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const location = formData.get("location") as string
  const isActive = formData.get("isActive") === "on"
  const result = await updateWarehouse({ id, name, location, isActive })
  if (result.success) redirect(`/admin/dashboard/warehouses/${id}`)
}

export default async function EditWarehousePage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getWarehouseById(id)
  if (!result.success) notFound()
  const warehouse = result.data!

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/dashboard/warehouses/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Warehouse
        </Link>
        <h1 className="text-3xl font-bold">Edit Warehouse</h1>
      </div>

      <Card className="max-w-xl">
        <CardHeader><CardTitle>Warehouse Details</CardTitle></CardHeader>
        <CardContent>
          <form action={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={warehouse.id} />
            <div>
              <label htmlFor="name" className="text-sm font-medium block mb-1">Name</label>
              <input id="name" name="name" required defaultValue={warehouse.name}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="location" className="text-sm font-medium block mb-1">Location</label>
              <input id="location" name="location" required defaultValue={warehouse.location ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input id="isActive" name="isActive" type="checkbox" defaultChecked={warehouse.isActive}
                className="h-4 w-4 rounded border-gray-300" />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
