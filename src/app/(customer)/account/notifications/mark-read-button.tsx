"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markNotificationRead } from "@/features/notifications/actions"

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={async () => {
        await markNotificationRead(id)
        router.refresh()
      }}
    >
      <Check className="h-4 w-4" />
    </Button>
  )
}
