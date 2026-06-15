import Link from "next/link"
import { getBrands, deleteBrand, restoreBrand } from "@/features/brands/actions/manage-brands"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Brands | Admin" }

type Props = {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function AdminBrandsPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const search = sp.search
  const page = parseInt(sp.page ?? "1", 10)
  const { brands, total, pages } = await getBrands(search, page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground mt-1">{total} brands</p>
        </div>
        <Link href="/admin/dashboard/brands/new" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Brand</Link>
      </div>

      <form method="GET" className="flex gap-3">
        <Input name="search" placeholder="Search brands..." defaultValue={search ?? ""} className="max-w-sm" />
        <Button type="submit">Search</Button>
      </form>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Slug</div>
              <div className="col-span-2 text-center">Products</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {brands.map((b) => (
                <div key={b.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
                  <div className="col-span-4 font-medium truncate">{b.name}</div>
                  <div className="col-span-2 text-muted-foreground">/{b.slug}</div>
                  <div className="col-span-2 text-center">{b._count.products}</div>
                  <div className="col-span-2 text-center">{b.isActive ? <Eye className="h-4 w-4 inline text-green-500" /> : <EyeOff className="h-4 w-4 inline text-muted-foreground" />}</div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <Link href={`/admin/dashboard/brands/${b.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}><Pencil className="h-4 w-4" /></Link>
                    {b.deletedAt ? (
                      <form action={restoreBrand}><input type="hidden" name="id" value={b.id} /><Button variant="ghost" size="icon" type="submit"><RotateCcw className="h-4 w-4" /></Button></form>
                    ) : (
                      <form action={deleteBrand}><input type="hidden" name="id" value={b.id} /><Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button></form>
                    )}
                  </div>
                </div>
              ))}
              {brands.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No brands found</div>}
            </div>
          </div>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/brands?${new URLSearchParams({ ...(search ? { search } : {}), page: String(p) })}`}
              className={buttonVariants({ variant: p === page ? "default" : "outline", size: "sm" })}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
