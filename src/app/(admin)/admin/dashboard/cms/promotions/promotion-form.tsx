"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createPromotionBanner, updatePromotionBanner } from "@/features/homepage/actions/manage-promotions"
import { toast } from "sonner"

type Props = {
  initial?: {
    id: string
    title: string
    description: string | null
    image: string | null
    linkUrl: string | null
    linkText: string | null
    badge: string | null
    gradient: string
    isActive: boolean
    sortOrder: number
  }
}

export default function PromotionForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    linkUrl: initial?.linkUrl ?? "",
    linkText: initial?.linkText ?? "",
    badge: initial?.badge ?? "",
    gradient: initial?.gradient ?? "from-primary/10 to-primary/5",
    isActive: initial?.isActive ?? true,
    sortOrder: initial?.sortOrder ?? 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, description: form.description || undefined, image: form.image || undefined, linkUrl: form.linkUrl || undefined, linkText: form.linkText || undefined, badge: form.badge || undefined }
      const result = initial ? await updatePromotionBanner(initial.id, data) : await createPromotionBanner(data)
      if (result.success) {
        toast.success(initial ? "Promotion updated" : "Promotion created")
        router.push("/admin/dashboard/cms/promotions")
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
        <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Badge</Label><Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="New" /></div>
          <div className="space-y-2"><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Link URL</Label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></div>
          <div className="space-y-2"><Label>Link Text</Label><Input value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Gradient</Label><Input value={form.gradient} onChange={(e) => setForm({ ...form, gradient: e.target.value })} /></div>
          <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} /></div>
        </div>
        <div className="flex items-center gap-2 pt-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
      </CardContent></Card>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initial ? "Update" : "Create"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
