"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createBrand, updateBrand } from "@/features/brands/actions/manage-brands"
import { toast } from "sonner"

type Props = {
  initial?: {
    id: string
    name: string
    slug: string
    logo: string | null
    description: string | null
    isActive: boolean
  }
}

export default function BrandForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    logo: initial?.logo ?? "",
    description: initial?.description ?? "",
    isActive: initial?.isActive ?? true,
  })

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: initial ? prev.slug : name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...form,
        logo: form.logo || undefined,
        description: form.description || undefined,
      }
      const result = initial
        ? await updateBrand(initial.id, data)
        : await createBrand(data)
      if (result.success) {
        toast.success(initial ? "Brand updated" : "Brand created")
        router.push("/admin/dashboard/brands")
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card><CardContent className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
        </div>
        <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://example.com/logo.png" /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
      </CardContent></Card>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initial ? "Update" : "Create"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
