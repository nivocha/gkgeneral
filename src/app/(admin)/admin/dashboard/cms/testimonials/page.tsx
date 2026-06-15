import Link from "next/link"
import { requireAuth } from "@/lib/auth/session"
import { getTestimonials } from "@/features/homepage/actions/manage-testimonials"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react"
import { deleteTestimonial } from "@/features/homepage/actions/manage-testimonials"

export const dynamic = "force-dynamic"
export const metadata = { title: "Testimonials | CMS" }

export default async function TestimonialsListPage() {
  await requireAuth()
  const testimonials = await getTestimonials()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground mt-1">{testimonials.length} testimonials</p>
        </div>
        <Link href="/admin/dashboard/cms/testimonials/new" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Testimonial</Link>
      </div>
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2 text-center">Rating</div>
          <div className="col-span-2 text-center">Sort</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {testimonials.map((t) => (
            <div key={t.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
              <div className="col-span-3 font-medium truncate">{t.name}</div>
              <div className="col-span-2 text-muted-foreground truncate">{t.company ?? "\u2014"}</div>
              <div className="col-span-2 text-center">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 inline text-yellow-500 fill-yellow-500" />)}</div>
              <div className="col-span-2 text-center">{t.sortOrder}</div>
              <div className="col-span-1 text-center">{t.isActive ? <Eye className="h-4 w-4 inline text-green-500" /> : <EyeOff className="h-4 w-4 inline text-muted-foreground" />}</div>
              <div className="col-span-2 flex justify-end gap-1">
                <Link href={`/admin/dashboard/cms/testimonials/${t.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}><Pencil className="h-4 w-4" /></Link>
                <form action={deleteTestimonial}><input type="hidden" name="id" value={t.id} /><Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button></form>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No testimonials yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
