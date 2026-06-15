"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CreditCard, Smartphone, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updatePaymentLinkCustomer } from "@/features/payments/actions/payment-links"
import { initiatePaymentLinkPayment } from "@/features/payments/actions/initiate-payment-link"
import { toast } from "sonner"

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Credit/Debit Card", icon: CreditCard },
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building2 },
] as const

type OrderSummary = {
  id: string
  orderNumber: string
  total: { toString: () => string }
  items: Array<{ id: string; name: string; quantity: number; total: { toString: () => string } }>
}

export function PayPageClient({ token, order }: { token: string; order: OrderSummary }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<string>("mobile_money")
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required")
      return
    }
    setLoading(true)
    try {
      await updatePaymentLinkCustomer(token, {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address ? { street: form.address } : undefined,
      })
      const result = await initiatePaymentLinkPayment(token)
      if (!result.success) throw new Error(result.message)
      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl
      } else {
        toast.success("Payment initiated!")
        router.push(`/pay/${token}/success`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="font-semibold">Your Details</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 255712345678" required />
            <p className="text-xs text-muted-foreground mt-1">Enter your phone number with country code</p>
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="address">Delivery Address (optional)</Label>
            <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Payment Method</h2>
        <div className="grid gap-2">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => setMethod(pm.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                  method === pm.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{pm.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Processing..." : `Pay TZS ${Number(order.total).toLocaleString("en-US")}`}
      </Button>
    </form>
  )
}
