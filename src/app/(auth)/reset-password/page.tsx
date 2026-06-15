"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPasswordAction } from "@/features/auth/actions/password-reset"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [state, action, pending] = useActionState(resetPasswordAction, undefined)

  useEffect(() => {
    if (state?.success) {
      const timeout = setTimeout(() => router.push("/login"), 3000)
      return () => clearTimeout(timeout)
    }
  }, [state?.success, router])

  if (!token) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-16">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>This reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-16">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password.</CardDescription>
        </CardHeader>
        <form action={action}>
          <input type="hidden" name="token" value={token} />
          <CardContent className="space-y-4">
            {state?.success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{state.message} Redirecting to login...</AlertDescription>
              </Alert>
            )}
            {state?.message && !state?.success && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            {state?.errors?.password && (
              <Alert variant="destructive">
                <AlertDescription>{state.errors.password.join(", ")}</AlertDescription>
              </Alert>
            )}
            {!state?.success && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required minLength={8} />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-3">
            {!state?.success && (
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
