"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createCmsPage, updateCmsPage } from "@/features/cms/actions/cms-actions"
import { toast } from "sonner"

type Props = {
  initial?: {
    id: string
    title: string
    slug: string
    content: string
    metaTitle: string | null
    metaDescription: string | null
    isActive: boolean
  }
}

export default function CmsPageForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    content: initial?.content ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    isActive: initial?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...form,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      }
      const result = initial
        ? await updateCmsPage(initial.id, data)
        : await createCmsPage(data)
      if (result.success) {
        toast.success(initial ? "Page updated" : "Page created")
        router.push("/admin/dashboard/cms/pages")
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
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} required placeholder="about" /></div>
        </div>
        <div className="space-y-2"><Label>Content (HTML)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required className="min-h-[300px] font-mono text-sm" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
          <div className="space-y-2"><Label>Meta Description</Label><Input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
      </CardContent></Card>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initial ? "Update" : "Create"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
