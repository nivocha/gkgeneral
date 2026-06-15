import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const metadata = { title: "Settings | Admin" }

export default async function AdminSettingsPage() {
  await requireRole("super_admin", "admin")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">System configuration</p>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application</span>
            <span className="font-medium">GK General Supply</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Store</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Currency</span>
            <span className="font-medium">TZS (Tanzanian Shilling)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax Rate</span>
            <span className="font-medium">18% VAT</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
