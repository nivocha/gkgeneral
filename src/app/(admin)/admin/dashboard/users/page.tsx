import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Users | Admin" }

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireRole("super_admin", "admin")
  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">{total} total users</p>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Joined</div>
        </div>
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
              <div className="col-span-3 font-medium truncate">{user.name}</div>
              <div className="col-span-3 text-muted-foreground truncate">{user.email}</div>
              <div className="col-span-2">
                <Badge variant="outline" className="capitalize">{user.role}</Badge>
              </div>
              <div className="col-span-2">
                <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="col-span-2 text-muted-foreground text-xs">{formatDate(user.createdAt)}</div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="px-4 py-12 text-center text-muted-foreground">No users found</div>
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
              href={`/admin/dashboard/users?page=${p}`}
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
