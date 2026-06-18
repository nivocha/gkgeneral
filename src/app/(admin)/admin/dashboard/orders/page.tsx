import Link from "next/link"
import { getAdminOrders } from "@/features/orders/actions"
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge"
import { requireRole } from "@/lib/auth/session"
import { formatPrice, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronRight, Search, Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Orders | Admin",
}

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireRole("super_admin", "admin", "sales_manager", "customer_support")

  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const status = sp.status || "all"
  const search = sp.search || ""
  const sortBy = sp.sortBy || "createdAt"
  const sortOrder = (sp.sortOrder || "desc") as "asc" | "desc"

  const result = await getAdminOrders({
    page,
    pageSize: 20,
    status: status as any,
    search,
    sortBy,
    sortOrder,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">{result.total} total orders</p>
        </div>
        <Link href="/admin/dashboard/orders/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />New Order
        </Link>
      </div>

      <form className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search orders..."
            defaultValue={search}
            className="pl-9"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Paid">Paid</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Filter
        </button>
      </form>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">Order</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-1 text-center">Items</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        <div className="divide-y">
          {result.items.map((order) => (
            <Link
              key={order.id}
              href={`/admin/dashboard/orders/${order.id}`}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/30 items-center"
            >
              <div className="col-span-2 font-mono font-medium">{order.orderNumber}</div>
              <div className="col-span-2 truncate">{order.customer.name}</div>
              <div className="col-span-2 truncate text-muted-foreground">{order.customer.email}</div>
              <div className="col-span-1 text-center">{order.itemCount}</div>
              <div className="col-span-2 text-right font-medium">{formatPrice(order.total)}</div>
              <div className="col-span-1"><OrderStatusBadge status={order.status} /></div>
              <div className="col-span-1 text-muted-foreground text-xs">{formatDate(order.createdAt)}</div>
              <div className="col-span-1 text-right">
                <ChevronRight className="h-4 w-4 inline text-muted-foreground" />
              </div>
            </Link>
          ))}
          {result.items.length === 0 && (
            <div className="px-4 py-12 text-center text-muted-foreground">
              No orders found
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/orders?page=${p}&status=${status}&search=${search}`}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background hover:bg-accent"
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
