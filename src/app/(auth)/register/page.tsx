import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth/session"
import { SignUpForm } from "@/features/auth/components/sign-up-form"

export default async function RegisterPage() {
  const session = await getAuth()
  if (session?.user) {
    redirect("/account")
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-16">
      <SignUpForm />
    </div>
  )
}
