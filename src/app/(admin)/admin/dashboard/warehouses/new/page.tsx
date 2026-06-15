import { redirect } from "next/navigation"
import { createWarehouse } from "@/features/inventory/actions/warehouse"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = { title: "New Warehouse | Admin" }

async function handleCreate(formData: FormData) {
  "use server"
  const name = formData.get("name") as string
  const location = formData.get("location") as string
  const result = await createWarehouse({ name, location })
  if (result.success && result.data) {
    redirect(`/admin/dashboard/warehouses/${result.data.id}`)
  }
}

export default function NewWarehousePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/dashboard/warehouses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Warehouses
        </Link>
        <h1 className="text-3xl font-bold">New Warehouse</h1>
      </div>

      <Card className="max-w-xl">
        <CardHeader><CardTitle>Warehouse Details</CardTitle></CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium block mb-1">Name</label>
              <input id="name" name="name" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Main Warehouse" />
            </div>
            <div>
              <label htmlFor="location" className="text-sm font-medium block mb-1">Location</label>
              <input id="location" name="location" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Dar es Salaam, Tanzania" />
            </div>
            <Button type="submit">Create Warehouse</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
