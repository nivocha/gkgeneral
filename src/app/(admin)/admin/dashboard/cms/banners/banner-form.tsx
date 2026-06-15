"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createHeroBanner, updateHeroBanner } from "@/features/homepage/actions/manage-hero-banners"
import { toast } from "sonner"

type Props = {
  initial?: {
    id: string
    title: string
    subtitle: string | null
    description: string | null
    badge: string | null
    image: string | null
    linkUrl: string | null
    linkText: string | null
    gradient: string
    bgGlow: string | null
    iconColor: string | null
    iconName: string
    spec1: string | null
    spec2: string | null
    spec3: string | null
    sortOrder: number
    isActive: boolean
  }
}

export default function HeroBannerForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    description: initial?.description ?? "",
    badge: initial?.badge ?? "",
    image: initial?.image ?? "",
    linkUrl: initial?.linkUrl ?? "",
    linkText: initial?.linkText ?? "",
    gradient: initial?.gradient ?? "from-blue-900 to-slate-900",
    bgGlow: initial?.bgGlow ?? "",
    iconColor: initial?.iconColor ?? "",
    iconName: initial?.iconName ?? "Factory",
    spec1: initial?.spec1 ?? "",
    spec2: initial?.spec2 ?? "",
    spec3: initial?.spec3 ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, subtitle: form.subtitle || undefined, description: form.description || undefined, badge: form.badge || undefined, image: form.image || undefined, linkUrl: form.linkUrl || undefined, linkText: form.linkText || undefined, bgGlow: form.bgGlow || undefined, iconColor: form.iconColor || undefined, spec1: form.spec1 || undefined, spec2: form.spec2 || undefined, spec3: form.spec3 || undefined }
      const result = initial ? await updateHeroBanner(initial.id, data) : await createHeroBanner(data)
      if (result.success) {
        toast.success(initial ? "Banner updated" : "Banner created")
        router.push("/admin/dashboard/cms/banners")
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Subtitle</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Badge</Label><Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="New" /></div>
          <div className="space-y-2"><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <div className="space-y-2"><Label>Icon Name</Label><Input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Link URL</Label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></div>
          <div className="space-y-2"><Label>Link Text</Label><Input value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Gradient</Label><Input value={form.gradient} onChange={(e) => setForm({ ...form, gradient: e.target.value })} /></div>
          <div className="space-y-2"><Label>BG Glow</Label><Input value={form.bgGlow} onChange={(e) => setForm({ ...form, bgGlow: e.target.value })} /></div>
          <div className="space-y-2"><Label>Icon Color</Label><Input value={form.iconColor} onChange={(e) => setForm({ ...form, iconColor: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Spec 1</Label><Input value={form.spec1} onChange={(e) => setForm({ ...form, spec1: e.target.value })} /></div>
          <div className="space-y-2"><Label>Spec 2</Label><Input value={form.spec2} onChange={(e) => setForm({ ...form, spec2: e.target.value })} /></div>
          <div className="space-y-2"><Label>Spec 3</Label><Input value={form.spec3} onChange={(e) => setForm({ ...form, spec3: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} /></div>
          <div className="flex items-center gap-2 pt-6"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
        </div>
      </CardContent></Card>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initial ? "Update" : "Create"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
