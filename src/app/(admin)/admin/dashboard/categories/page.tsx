import Link from "next/link"
import { getAdminCategories } from "@/features/categories/actions/manage-categories"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Plus, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { deleteCategory } from "@/features/categories/actions/manage-categories"

export const dynamic = "force-dynamic"

export const metadata = { title: "Categories | Admin" }

export default async function AdminCategoriesPage() {
  await requireAuth()
  const categories = await getAdminCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">{categories.length} categories</p>
        </div>
        <Link href="/admin/dashboard/categories/new" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Category</Link>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Parent</div>
          <div className="col-span-2 text-center">Subcategories</div>
          <div className="col-span-2 text-center">Products</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
              <div className="col-span-4 font-medium">{cat.name}</div>
              <div className="col-span-3 text-muted-foreground">{cat.parent?.name ?? "\u2014"}</div>
              <div className="col-span-2 text-center">{cat._count.children}</div>
              <div className="col-span-2 text-center">{cat._count.products}</div>
              <div className="col-span-1 flex justify-end gap-1">
                <Link href={`/admin/dashboard/categories/${cat.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}><Pencil className="h-4 w-4" /></Link>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button>
                </form>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="px-4 py-12 text-center text-muted-foreground">No categories found</div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
