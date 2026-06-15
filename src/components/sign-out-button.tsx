"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { useSession } from "@/components/providers/session-provider"

export function SignOutButton({ variant = "ghost", className, iconOnly }: { variant?: "ghost" | "destructive"; className?: string; iconOnly?: boolean }) {
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const { refresh } = useSession()

  async function handleSignOut() {
    setPending(true)
    try {
      await authClient.signOut()
      await refresh()
      router.push("/")
      router.refresh()
    } catch {
      console.error("Failed to sign out")
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleSignOut} disabled={pending} type="button">
      {pending ? (
        <Loader2 className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4 animate-spin"} />
      ) : (
        <LogOut className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      )}
      {!iconOnly && "Sign Out"}
    </Button>
  )
}
