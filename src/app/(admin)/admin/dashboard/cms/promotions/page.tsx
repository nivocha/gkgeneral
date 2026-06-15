import Link from "next/link"
import { requireAuth } from "@/lib/auth/session"
import { getPromotionBanners } from "@/features/homepage/actions/manage-promotions"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { deletePromotionBanner } from "@/features/homepage/actions/manage-promotions"

export const dynamic = "force-dynamic"
export const metadata = { title: "Promotions | CMS" }

export default async function PromotionsListPage() {
  await requireAuth()
  const banners = await getPromotionBanners()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground mt-1">{banners.length} promotions</p>
        </div>
        <Link href="/admin/dashboard/cms/promotions/new" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Promotion</Link>
      </div>
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Badge</div>
          <div className="col-span-2 text-center">Sort</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {banners.map((b) => (
            <div key={b.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
              <div className="col-span-4 font-medium truncate">{b.title}</div>
              <div className="col-span-2 text-muted-foreground">{b.badge ?? "\u2014"}</div>
              <div className="col-span-2 text-center">{b.sortOrder}</div>
              <div className="col-span-2 text-center">{b.isActive ? <Eye className="h-4 w-4 inline text-green-500" /> : <EyeOff className="h-4 w-4 inline text-muted-foreground" />}</div>
              <div className="col-span-2 flex justify-end gap-1">
                <Link href={`/admin/dashboard/cms/promotions/${b.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}><Pencil className="h-4 w-4" /></Link>
                <form action={deletePromotionBanner}><input type="hidden" name="id" value={b.id} /><Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button></form>
              </div>
            </div>
          ))}
          {banners.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No promotions yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
