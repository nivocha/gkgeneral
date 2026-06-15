"use client"

import { useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authClient } from "@/lib/auth/client"
import { syncCartAction } from "@/features/carts/actions"
import { useCartStore } from "@/features/carts/store"
import { useSession } from "@/components/providers/session-provider"

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: "/admin/dashboard",
  admin: "/admin/dashboard",
  inventory_manager: "/admin/dashboard/inventory",
  sales_manager: "/admin/dashboard/orders",
  customer: "/account",
}

export function SignInForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const { refresh } = useSession()

  const redirectTo = useCallback((role?: string) => {
    const redirectParam = searchParams.get("redirect")
    if (redirectParam) return redirectParam
    return ROLE_REDIRECTS[role ?? "customer"] || "/account"
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)

    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      })

      if (signInError) {
        setError(signInError.message || "Invalid credentials")
        return
      }

      await refresh()

      if (items.length > 0) {
        try {
          await syncCartAction(
            items.map((i) => ({
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              image: i.image,
              slug: i.slug,
            }))
          )
        } catch {
          // Cart sync is best-effort
        }
      }

      const role = (data?.user as { role?: string })?.role || "customer"
      const target = redirectTo(role)
      window.location.href = target
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Access your account to manage orders and quotes.</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@company.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <div className="text-sm text-right">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
