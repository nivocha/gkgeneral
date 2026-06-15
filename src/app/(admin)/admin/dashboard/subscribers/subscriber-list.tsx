"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Download } from "lucide-react"
import { deleteSubscriber, exportSubscribersCSV } from "@/features/newsletter/actions/subscriber-actions"
import { toast } from "sonner"

export default function SubscriberList({
  subscribers,
  total,
  pages,
  currentPage,
  search,
}: {
  subscribers: { id: string; email: string; createdAt: string }[]
  total: number
  pages: number
  currentPage: number
  search?: string
}) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)

  const handleDelete = async (formData: FormData) => {
    await deleteSubscriber(formData)
    toast.success("Subscriber deleted")
    router.refresh()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = await exportSubscribersCSV()
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "subscribers.csv"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Subscribers exported")
    } catch {
      toast.error("Failed to export")
    } finally {
      setExporting(false)
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get("search") as string
    router.push(`/admin/dashboard/subscribers${q ? `?search=${encodeURIComponent(q)}` : ""}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground mt-1">{total} subscribers</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? "Exporting..." : <><Download className="h-4 w-4 mr-2" />Export CSV</>}
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <Input name="search" placeholder="Search by email..." defaultValue={search ?? ""} className="max-w-sm" />
        <Button type="submit">Search</Button>
      </form>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-6">Email</div>
              <div className="col-span-4">Subscribed At</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {subscribers.map((s) => (
                <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
                  <div className="col-span-6 font-medium truncate">{s.email}</div>
                  <div className="col-span-4 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <form action={handleDelete}><input type="hidden" name="id" value={s.id} /><Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button></form>
                  </div>
                </div>
              ))}
              {subscribers.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No subscribers found</div>}
            </div>
          </div>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => router.push(`/admin/dashboard/subscribers?${new URLSearchParams({ ...(search ? { search } : {}), page: String(p) })}`)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
