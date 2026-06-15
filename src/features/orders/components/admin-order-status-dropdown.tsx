"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OrderStatus } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const statusOptions = [
  { value: "Pending" as const, label: "Pending" },
  { value: "Processing" as const, label: "Processing" },
  { value: "Paid" as const, label: "Paid" },
  { value: "Shipped" as const, label: "Shipped" },
  { value: "Delivered" as const, label: "Delivered" },
  { value: "Cancelled" as const, label: "Cancelled" },
  { value: "Refunded" as const, label: "Refunded" },
]

export function AdminOrderStatusDropdown({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const [status, setStatus] = useState<string>(currentStatus)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  async function handleStatusChange(value: string) {
    if (value === currentStatus) return
    setUpdating(true)
    try {
      const { updateOrderStatus } = await import("@/features/orders/actions")
      const result = await updateOrderStatus(orderId, {
        status: value as OrderStatus,
      })
      if (result.success) {
        setStatus(value)
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
        setStatus(currentStatus)
      }
    } catch {
      toast.error("Failed to update status")
      setStatus(currentStatus)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleStatusChange} disabled={updating}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updating && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  )
}
