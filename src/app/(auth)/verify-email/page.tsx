import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid Verification Link</h1>
          <p className="text-muted-foreground">This verification link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  try {
    await auth.api.verifyEmail({
      query: { token },
      headers: await headers(),
    })
  } catch {
    return (
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Verification Failed</h1>
          <p className="text-muted-foreground">This verification link is invalid or has expired. Request a new one.</p>
        </div>
      </div>
    )
  }

  redirect("/account?verified=true")
}
