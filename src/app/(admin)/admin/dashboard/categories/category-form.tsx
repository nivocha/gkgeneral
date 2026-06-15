"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createCategory, updateCategory } from "@/features/categories/actions/manage-categories"
import { toast } from "sonner"

type ParentOption = { id: string; name: string }

export default function CategoryForm({
  parents,
  initial,
}: {
  parents: ParentOption[]
  initial?: {
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    icon: string | null
    parentId: string | null
    sortOrder: number
    isActive: boolean
  }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    icon: initial?.icon ?? "",
    parentId: initial?.parentId ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...form,
        parentId: form.parentId || null,
        description: form.description || undefined,
      image: form.image || undefined,
      icon: form.icon || undefined,
      }
      const result = initial
        ? await updateCategory(initial.id, data)
        : await createCategory(data)

      if (result.success) {
        toast.success(initial ? "Category updated" : "Category created")
        router.push("/admin/dashboard/categories")
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => {
                setForm({ ...form, name: e.target.value })
                if (!initial) setForm((prev) => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }))
              }} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <select
                id="parent"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None (top level)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input id="sortOrder" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icon Name</Label>
            <Input id="icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g., Zap, Factory, Sun" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initial ? "Update Category" : "Create Category"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
