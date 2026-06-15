import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth/session"
import { SignInForm } from "@/features/auth/components/sign-in-form"

export default async function LoginPage() {
  const session = await getAuth()
  if (session?.user) {
    const role = (session.user as { role?: string })?.role || "customer"
    if (role === "super_admin" || role === "admin") {
      redirect("/admin/dashboard")
    }
    redirect("/account")
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-16">
      <SignInForm />
    </div>
  )
}
