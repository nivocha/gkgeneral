import Link from "next/link"
import { requireAuth } from "@/lib/auth/session"
import { getSiteStatistics } from "@/features/homepage/actions/manage-statistics"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { deleteSiteStatistic } from "@/features/homepage/actions/manage-statistics"

export const dynamic = "force-dynamic"
export const metadata = { title: "Statistics | CMS" }

export default async function StatisticsListPage() {
  await requireAuth()
  const stats = await getSiteStatistics()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistics</h1>
          <p className="text-muted-foreground mt-1">{stats.length} statistics</p>
        </div>
        <Link href="/admin/dashboard/cms/statistics/new" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Statistic</Link>
      </div>
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Label</div>
          <div className="col-span-2">Value</div>
          <div className="col-span-2">Prefix / Suffix</div>
          <div className="col-span-2 text-center">Sort</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {stats.map((s) => (
            <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
              <div className="col-span-3 font-medium truncate">{s.label}</div>
              <div className="col-span-2 text-muted-foreground">{s.value}</div>
              <div className="col-span-2 text-muted-foreground">{(s.prefix ?? "") + " / " + (s.suffix ?? "")}</div>
              <div className="col-span-2 text-center">{s.sortOrder}</div>
              <div className="col-span-1 text-center">{s.isActive ? <Eye className="h-4 w-4 inline text-green-500" /> : <EyeOff className="h-4 w-4 inline text-muted-foreground" />}</div>
              <div className="col-span-2 flex justify-end gap-1">
                <Link href={`/admin/dashboard/cms/statistics/${s.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}><Pencil className="h-4 w-4" /></Link>
                <form action={deleteSiteStatistic}><input type="hidden" name="id" value={s.id} /><Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button></form>
              </div>
            </div>
          ))}
          {stats.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No statistics yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
