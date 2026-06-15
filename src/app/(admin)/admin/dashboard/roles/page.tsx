import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Roles | Admin" }

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AdminRolesPage({ searchParams }: Props) {
  await requireRole("super_admin", "admin")
  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      select: { id: true, name: true, description: true, isSystem: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.role.count(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Roles</h1>
        <p className="text-muted-foreground mt-1">{total} total roles</p>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Role</div>
          <div className="col-span-5">Description</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Created</div>
        </div>
        <div className="divide-y">
          {roles.map((role) => (
            <div key={role.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
              <div className="col-span-3 font-medium capitalize">{role.name.replace(/_/g, " ")}</div>
              <div className="col-span-5 text-muted-foreground truncate">{role.description || "—"}</div>
              <div className="col-span-2">
                <Badge variant={role.isSystem ? "default" : "outline"}>
                  {role.isSystem ? "System" : "Custom"}
                </Badge>
              </div>
              <div className="col-span-2 text-muted-foreground text-xs">{formatDate(role.createdAt)}</div>
            </div>
          ))}
          {roles.length === 0 && (
            <div className="px-4 py-12 text-center text-muted-foreground">No roles found</div>
          )}
            </div>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/roles?page=${p}`}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                p === page ? "bg-primary text-primary-foreground" : "border border-input bg-background hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
