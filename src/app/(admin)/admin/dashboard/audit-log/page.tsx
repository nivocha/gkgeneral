import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/session"
import { formatDateTime } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Audit Log | Admin" }

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AuditLogPage({ searchParams }: Props) {
  await requireRole("super_admin", "admin")
  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const pageSize = 30
  const skip = (page - 1) * pageSize

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">{total} total events</p>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">When</div>
          <div className="col-span-1">Action</div>
          <div className="col-span-1">Entity</div>
          <div className="col-span-2">User</div>
          <div className="col-span-6">Description</div>
        </div>
        <div className="divide-y">
          {logs.map((log) => (
            <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
              <div className="col-span-2 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</div>
              <div className="col-span-1">
                <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                  log.action === "CREATE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" :
                  log.action === "UPDATE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  log.action === "DELETE" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                  "bg-muted text-muted-foreground"
                }`}>{log.action}</span>
              </div>
              <div className="col-span-1 text-muted-foreground">{log.entity}</div>
              <div className="col-span-2 truncate text-muted-foreground">{log.user?.name || log.user?.email || "System"}</div>
              <div className="col-span-6 truncate">{log.description || "—"}</div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="px-4 py-12 text-center text-muted-foreground">No audit log entries found</div>
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
              href={`/admin/dashboard/audit-log?page=${p}`}
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
