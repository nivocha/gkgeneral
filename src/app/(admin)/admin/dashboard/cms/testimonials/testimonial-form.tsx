"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createTestimonial, updateTestimonial } from "@/features/homepage/actions/manage-testimonials"
import { toast } from "sonner"

type Props = {
  initial?: {
    id: string
    name: string
    title: string | null
    company: string | null
    avatar: string | null
    content: string
    rating: number
    isActive: boolean
    sortOrder: number
  }
}

export default function TestimonialForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    title: initial?.title ?? "",
    company: initial?.company ?? "",
    avatar: initial?.avatar ?? "",
    content: initial?.content ?? "",
    rating: initial?.rating ?? 5,
    isActive: initial?.isActive ?? true,
    sortOrder: initial?.sortOrder ?? 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, title: form.title || undefined, company: form.company || undefined, avatar: form.avatar || undefined }
      const result = initial ? await updateTestimonial(initial.id, data) : await createTestimonial(data)
      if (result.success) {
        toast.success(initial ? "Testimonial updated" : "Testimonial created")
        router.push("/admin/dashboard/cms/testimonials")
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
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div className="space-y-2"><Label>Avatar URL</Label><Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 5 })} /></div>
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
