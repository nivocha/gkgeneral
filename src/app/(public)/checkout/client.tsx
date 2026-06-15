"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/features/carts/store"
import { formatPrice } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Check, Loader2, Building2, Smartphone, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSession } from "@/components/providers/session-provider"
import { getAddresses } from "@/features/addresses/actions"
import type { MnoProvider } from "@/features/payments/lib/mno"

function detectMnoProvider(phone: string): MnoProvider {
  const cleaned = phone.replace(/[^0-9]/g, "")
  const local = cleaned.startsWith("255") ? "0" + cleaned.slice(3) : cleaned
  const prefix3 = local.slice(0, 3)
  const prefix4 = local.slice(0, 4)
  if (prefix4 === "0712" || prefix3 === "065" || prefix4 === "0765" || prefix4 === "0766") return "tigo_pesa"
  if (prefix3 === "068" || prefix3 === "069" || prefix4 === "0780" || prefix4 === "0781" || prefix3 === "062") return "airtel_money"
  if (prefix4 === "0677" || prefix4 === "0678" || prefix4 === "0679" || prefix4 === "0787" || prefix4 === "0788") return "halopesa"
  return "mpesa"
}

function getBankDetails() {
  return {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || "NMB Bank",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "GK General Supply Ltd",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "1231001234567",
  }
}

const mnoLabels: Record<MnoProvider, string> = {
  mpesa: "M-Pesa",
  tigo_pesa: "Tigo Pesa",
  airtel_money: "Airtel Money",
  halopesa: "HaloPesa",
}

const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone number is required"),
  billingStreet: z.string().min(1, "Street is required"),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCountry: z.string(),
  sameAsBilling: z.boolean(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZipCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingMethod: z.enum(["standard", "express", "same_day"]),
  paymentMethod: z.enum(["bank_transfer", "mobile_money", "credit_card"]),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.sameAsBilling) {
    if (!data.shippingStreet) ctx.addIssue({ code: "custom", path: ["shippingStreet"], message: "Street is required" })
    if (!data.shippingCity) ctx.addIssue({ code: "custom", path: ["shippingCity"], message: "City is required" })
    if (!data.shippingCountry) ctx.addIssue({ code: "custom", path: ["shippingCountry"], message: "Country is required" })
  }
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const steps = ["Customer Info", "Address", "Shipping", "Payment", "Confirmation"]

const stepFields: Record<number, (keyof CheckoutFormData)[]> = {
  0: ["firstName", "lastName", "email", "phone"],
  1: ["billingStreet", "billingCity", "billingState", "billingZipCode", "billingCountry"],
  2: ["shippingMethod"],
  3: ["paymentMethod"],
}

const shippingRates: Record<string, number> = {
  standard: 0,
  express: 15000,
  same_day: 35000,
}

const shippingLabels: Record<string, string> = {
  standard: "Standard Shipping",
  express: "Express Shipping",
  same_day: "Same Day Delivery",
}

export default function CheckoutPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [stepLoading, setStepLoading] = useState<number | null>(null)
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string
    orderId: string
    paymentMethod?: string
    paymentStatus?: string
    mnoProvider?: MnoProvider
  } | null>(null)
  const navigatingRef = useRef(false)
  const { items, clearCart } = useCartStore()

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      billingStreet: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      billingCountry: "Tanzania",
      sameAsBilling: true,
      shippingStreet: "",
      shippingCity: "",
      shippingState: "",
      shippingZipCode: "",
      shippingCountry: "Tanzania",
      shippingMethod: "standard",
      paymentMethod: undefined,
      notes: "",
    },
  })

  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = form
  const shippingMethod = watch("shippingMethod")
  const sameAsBilling = watch("sameAsBilling")
  const paymentMethod = watch("paymentMethod")

  useEffect(() => {
    if (!user) return
    getAddresses().then((addresses) => {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr) {
        setValue("billingStreet", defaultAddr.street)
        setValue("billingCity", defaultAddr.city)
        setValue("billingState", defaultAddr.state || "")
        setValue("billingZipCode", defaultAddr.zipCode || "")
        setValue("billingCountry", defaultAddr.country)
      }
      const nameParts = (user.name || "").split(/\s+/)
      setValue("firstName", nameParts[0] || "")
      setValue("lastName", nameParts.slice(1).join(" ") || "")
      setValue("email", user.email || "")
      setValue("phone", "")
    })
  }, [user, setValue])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/checkout")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  if (items.length === 0 && !orderResult) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button onClick={() => router.push("/products")}>Browse Products</Button>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || "0") * item.quantity), 0)
  const shipping = shippingRates[shippingMethod] ?? 0
  const taxRate = 0.18
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax + shipping) * 100) / 100

  async function handleNext() {
    if (navigatingRef.current) return
    navigatingRef.current = true
    setStepLoading(step)
    let fields = stepFields[step]
    if (step === 1 && !sameAsBilling) {
      fields = [...fields, "shippingStreet", "shippingCity", "shippingCountry"]
    }
    if (!fields) {
      setStep((s) => Math.min(4, s + 1))
      setStepLoading(null)
      navigatingRef.current = false
      return
    }
    const valid = await trigger(fields)
    if (valid) {
      setStep((s) => Math.min(4, s + 1))
    } else {
      toast.error("Please fix the highlighted fields before continuing.")
    }
    setStepLoading(null)
    navigatingRef.current = false
  }

  async function onSubmit(data: CheckoutFormData) {
    setSubmitting(true)
    try {
      const { createOrder } = await import("@/features/orders/actions")

      const cartItems = useCartStore.getState().items
      if (cartItems.length === 0) {
        toast.error("Your cart is empty. Add products before checking out.")
        setSubmitting(false)
        return
      }

      const result = await createOrder({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        billingAddress: {
          street: data.billingStreet,
          city: data.billingCity,
          state: data.billingState || undefined,
          zipCode: data.billingZipCode || undefined,
          country: data.billingCountry,
        },
        shippingAddress: {
          sameAsBilling: data.sameAsBilling,
          street: data.sameAsBilling ? data.billingStreet : (data.shippingStreet || ""),
          city: data.sameAsBilling ? data.billingCity : (data.shippingCity || ""),
          state: data.sameAsBilling ? (data.billingState || undefined) : (data.shippingState || undefined),
          zipCode: data.sameAsBilling ? (data.billingZipCode || undefined) : (data.shippingZipCode || undefined),
          country: data.sameAsBilling ? data.billingCountry : (data.shippingCountry || "Tanzania"),
        },
        shippingMethod: data.shippingMethod,
        paymentMethod: data.paymentMethod,
        notes: data.notes || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          price: parseFloat(item.price || "0"),
          quantity: item.quantity,
        })),
      })

      if (!result.success) {
        toast.error(result.message)
        setSubmitting(false)
        return
      }

      const orderId = result.data!.orderId
      const orderNumber = result.data!.orderNumber

      if (data.paymentMethod === "credit_card") {
        const { initiatePayment } = await import("@/features/payments/actions/create-payment")
        const paymentResult = await initiatePayment(orderId, {
          street: data.billingStreet,
          city: data.billingCity,
          state: data.billingState || null,
          zipCode: data.billingZipCode || null,
          country: data.billingCountry,
        })
        if (paymentResult.success && paymentResult.data?.paymentUrl) {
          clearCart()
          setOrderResult({ orderNumber, orderId, paymentMethod: "credit_card", paymentStatus: "redirecting" })
          toast.success("Redirecting to payment gateway...")
          await new Promise((r) => setTimeout(r, 800))
          window.location.href = paymentResult.data.paymentUrl
          return
        }
        if (paymentResult.success && !paymentResult.data?.paymentUrl) {
          clearCart()
          setOrderResult({ orderNumber, orderId, paymentMethod: "credit_card", paymentStatus: "pending" })
          setStep(4)
          toast.success("Order placed! We will contact you for payment.")
          setSubmitting(false)
          return
        }
        toast.error(paymentResult.message)
        setSubmitting(false)
        return
      }

      if (data.paymentMethod === "mobile_money") {
        const { initiateMnoPayment } = await import("@/features/payments/actions/mno-payment")
        const provider = detectMnoProvider(data.phone)
        const paymentResult = await initiateMnoPayment({ orderId, phoneNumber: data.phone, provider })
        if (paymentResult.success) {
          clearCart()
          setOrderResult({ orderNumber, orderId, paymentMethod: "mobile_money", paymentStatus: "pending", mnoProvider: provider })
          setStep(4)
          toast.success("Payment prompt sent to your phone!")
        } else {
          toast.error(paymentResult.message)
        }
        setSubmitting(false)
        return
      }

      clearCart()
      setOrderResult({ orderNumber, orderId, paymentMethod: "bank_transfer", paymentStatus: "pending" })
      setStep(4)
      toast.success("Order placed successfully!")
    } catch (error: any) {
      toast.error(error?.message || "Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="flex items-center justify-center mb-8">
        {steps.map((s, idx) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2",
              idx <= step ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                idx < step ? "bg-primary text-primary-foreground border-primary" :
                idx === step ? "border-primary text-primary" : "border-muted-foreground"
              )}>
                {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{s}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                "w-8 h-px mx-2 sm:w-16",
                idx < step ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{steps[step]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === 0 && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...register("firstName")} placeholder="John" />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...register("email")} placeholder="john@company.com" />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" {...register("phone")} placeholder="+255 700 000 000" />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Billing Address</Label>
                      <Input placeholder="Street address" {...register("billingStreet")} />
                      {errors.billingStreet && <p className="text-sm text-destructive">{errors.billingStreet.message}</p>}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Input placeholder="City" {...register("billingCity")} />
                          {errors.billingCity && <p className="text-sm text-destructive">{errors.billingCity.message}</p>}
                        </div>
                        <Input placeholder="Postal code" {...register("billingZipCode")} />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sameAsBilling}
                          onChange={(e) => setValue("sameAsBilling", e.target.checked, { shouldValidate: true })}
                          className="accent-primary"
                        />
                        Same as billing address
                      </label>
                    </div>
                    {!sameAsBilling && (
                      <div className="space-y-2">
                        <Label>Shipping Address</Label>
                        <Input placeholder="Street address" {...register("shippingStreet")} />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input placeholder="City" {...register("shippingCity")} />
                          <Input placeholder="Postal code" {...register("shippingZipCode")} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    {["standard", "express", "same_day"].map((method) => (
                      <label
                        key={method}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:border-primary",
                          shippingMethod === method && "border-primary bg-primary/5"
                        )}
                      >
                        <input
                          type="radio"
                          value={method}
                          {...register("shippingMethod")}
                          className="accent-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{shippingLabels[method]}</p>
                          <p className="text-sm text-muted-foreground">
                            {method === "standard" && "Free · 3-5 business days"}
                            {method === "express" && `${formatPrice(shippingRates[method])} · 1-2 business days`}
                            {method === "same_day" && `${formatPrice(shippingRates[method])} · Same day within Dar es Salaam`}
                          </p>
                        </div>
                        <p className="font-medium">
                          {shippingRates[method] === 0 ? "Free" : formatPrice(shippingRates[method])}
                        </p>
                      </label>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    {[
                      { value: "bank_transfer" as const, label: "Bank Transfer", desc: "Direct bank transfer to our account" },
                      { value: "mobile_money" as const, label: "Mobile Money", desc: "M-Pesa, Tigo Pesa, Airtel Money" },
                      { value: "credit_card" as const, label: "Credit Card", desc: "Visa, Mastercard, Amex" },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:border-primary",
                          watch("paymentMethod") === method.value && "border-primary bg-primary/5"
                        )}
                      >
                        <input
                          type="radio"
                          value={method.value}
                          {...register("paymentMethod")}
                          className="accent-primary"
                        />
                        <div>
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                    {errors.paymentMethod && (
                      <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
                    )}
                  </div>
                )}

                {step === 4 && orderResult && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                      {orderResult.paymentMethod === "credit_card" ? (
                        <ExternalLink className="h-8 w-8 text-emerald-600" />
                      ) : orderResult.paymentMethod === "mobile_money" ? (
                        <Smartphone className="h-8 w-8 text-emerald-600" />
                      ) : (
                        <Building2 className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Order Placed Successfully!</h2>
                    <p className="text-muted-foreground mb-2">
                      Your order number is:
                    </p>
                    <p className="text-2xl font-bold text-primary mb-6">
                      {orderResult.orderNumber}
                    </p>

                    {orderResult.paymentMethod === "bank_transfer" && (
                      <div className="bg-muted rounded-lg p-4 mb-6 text-left max-w-md mx-auto space-y-2">
                        <h3 className="font-semibold text-sm text-center mb-3">Bank Transfer Details</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="font-medium">{getBankDetails().bankName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Account Name:</span>
                          <span className="font-medium">{getBankDetails().accountName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-medium">{getBankDetails().accountNumber}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          Use your order number as payment reference. Your order will be processed
                          once payment is confirmed.
                        </p>
                      </div>
                    )}

                    {orderResult.paymentMethod === "mobile_money" && orderResult.mnoProvider && (
                      <div className="bg-muted rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                        <div className="flex items-center gap-2 justify-center mb-3">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-sm">Mobile Money Payment</h3>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          A payment prompt has been sent via <strong>{mnoLabels[orderResult.mnoProvider]}</strong>.
                          Please check your phone and enter your PIN to complete the payment.
                        </p>
                      </div>
                    )}

                    {orderResult.paymentMethod === "credit_card" && orderResult.paymentStatus !== "redirecting" && (
                      <div className="bg-muted rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                        <p className="text-sm text-muted-foreground text-center">
                          Your order is pending payment. Online payment is not currently available.
                          We will contact you to arrange payment.
                        </p>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mb-6">
                      {orderResult.paymentMethod === "credit_card" && orderResult.paymentStatus === "redirecting"
                        ? "You are being redirected to the payment gateway..."
                        : "You will receive a confirmation email shortly. You can track your order status from your account dashboard."
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => router.push(`/account/orders/${orderResult.orderId}`)}>
                        View Order
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/products")}>
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="truncate flex-1">{item.name} x{item.quantity}</span>
                    <span className="ml-2">{formatPrice(parseFloat(item.price || "0") * item.quantity)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {step < 4 && (
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || submitting || stepLoading !== null}
            >
              {stepLoading !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronLeft className="mr-2 h-4 w-4" />
              )}
              Back
            </Button>
            {step === 3 ? (
              <Button type="submit" disabled={submitting || !paymentMethod}>
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <>Place Order <ChevronRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={stepLoading === step}>
                {stepLoading === step ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
                ) : (
                  <>Continue <ChevronRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
