"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, MapPin, Pencil, Trash2, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from "@/features/addresses/actions"

type Address = Awaited<ReturnType<typeof getAddresses>>[number]

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [defaultingId, setDefaultingId] = useState<string | null>(null)

  useEffect(() => {
    getAddresses().then((data) => { setAddresses(data); setLoading(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      label: (formData.get("label") as string) || undefined,
      street: formData.get("street") as string,
      city: formData.get("city") as string,
      state: (formData.get("state") as string) || undefined,
      zipCode: (formData.get("zipCode") as string) || undefined,
      country: (formData.get("country") as string) || "Tanzania",
      isDefault: formData.get("isDefault") === "on",
    }
    const result = editing ? await updateAddress(editing.id, data) : await createAddress(data)
    if (result.success) {
      setDialogOpen(false)
      setEditing(null)
      setAddresses(await getAddresses())
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteAddress(id)
    setAddresses(await getAddresses())
    setDeletingId(null)
  }

  const handleSetDefault = async (id: string) => {
    setDefaultingId(id)
    await setDefaultAddress(id)
    setAddresses(await getAddresses())
    setDefaultingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">Manage your shipping addresses.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4 mr-1" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Address" : "New Address"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input id="label" name="label" defaultValue={editing?.label || ""} placeholder="Home, Office, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input id="street" name="street" required defaultValue={editing?.street || ""} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" name="city" required defaultValue={editing?.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" defaultValue={editing?.state || ""} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input id="zipCode" name="zipCode" defaultValue={editing?.zipCode || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue={editing?.country || "Tanzania"} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" name="isDefault" defaultChecked={editing?.isDefault || false} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="isDefault">Set as default address</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <>{editing ? "Update" : "Create"} Address</>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No addresses saved</h2>
          <p className="text-muted-foreground">Add a shipping address to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {addr.label || "Address"}
                      {addr.isDefault && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    </CardTitle>
                    {addr.isDefault && <CardDescription>Default</CardDescription>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(addr); setDialogOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deletingId === addr.id} onClick={() => handleDelete(addr.id)}>
                      {deletingId === addr.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{addr.street}</p>
                <p className="text-sm">{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.zipCode || ""}</p>
                <p className="text-sm text-muted-foreground">{addr.country}</p>
                  {!addr.isDefault && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2" disabled={defaultingId === addr.id} onClick={() => handleSetDefault(addr.id)}>
                      {defaultingId === addr.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Set as default
                    </Button>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
