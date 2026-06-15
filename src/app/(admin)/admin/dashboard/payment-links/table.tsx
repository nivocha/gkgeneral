"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { expirePaymentLink } from "@/features/payments/actions/payment-links"
import { Copy, XCircle, ExternalLink, Check } from "lucide-react"
import { toast } from "sonner"

type PaymentLink = {
  id: string
  token: string
  status: string
  customerName: string | null
  customerPhone: string | null
  expiresAt: Date | null
  createdAt: Date
  order: { orderNumber: string; total: { toString: () => string }; status: string }
}

const statusColors: Record<string, string> = {
  Active: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  Expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
}

export function PaymentLinksTable({ links }: { links: PaymentLink[] }) {
  const [list, setList] = useState(links)

  async function handleExpire(id: string) {
    await expirePaymentLink(id)
    setList((prev) => prev.map((l) => (l.id === id ? { ...l, status: "Expired" } : l)))
    toast.success("Link expired")
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url)
    toast.success("Link copied!")
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No payment links yet.</p>
        <p className="text-sm mt-1">Generate one from any order detail page.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((link) => {
            const url = `${window.location.origin}/pay/${link.token}`
            return (
              <TableRow key={link.id}>
                <TableCell>
                  <Link href={`/admin/dashboard/orders/${link.order.orderNumber}`} className="font-mono text-sm hover:underline">
                    {link.order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  {link.customerName ? (
                    <div>
                      <p className="text-sm font-medium">{link.customerName}</p>
                      {link.customerPhone && <p className="text-xs text-muted-foreground">{link.customerPhone}</p>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[link.status] || ""} variant="outline">
                    {link.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(link.createdAt)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {link.expiresAt ? formatDate(link.expiresAt) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(url)} title="Copy link">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Open link">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    {link.status === "Active" && (
                      <Button variant="ghost" size="icon" onClick={() => handleExpire(link.id)} title="Expire link">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
