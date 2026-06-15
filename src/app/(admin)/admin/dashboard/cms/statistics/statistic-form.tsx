"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { createSiteStatistic, updateSiteStatistic } from "@/features/homepage/actions/manage-statistics"
import { toast } from "sonner"

type Props = {
  initial?: {
    id: string
    label: string
    value: string
    prefix: string | null
    suffix: string | null
    iconName: string | null
    sortOrder: number
    isActive: boolean
  }
}

export default function StatisticForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    label: initial?.label ?? "",
    value: initial?.value ?? "",
    prefix: initial?.prefix ?? "",
    suffix: initial?.suffix ?? "",
    iconName: initial?.iconName ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, prefix: form.prefix || undefined, suffix: form.suffix || undefined, iconName: form.iconName || undefined }
      const result = initial ? await updateSiteStatistic(initial.id, data) : await createSiteStatistic(data)
      if (result.success) {
        toast.success(initial ? "Statistic updated" : "Statistic created")
        router.push("/admin/dashboard/cms/statistics")
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
          <div className="space-y-2"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Value</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Prefix</Label><Input value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} placeholder="+" /></div>
          <div className="space-y-2"><Label>Suffix</Label><Input value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="+" /></div>
          <div className="space-y-2"><Label>Icon Name</Label><Input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} /></div>
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
