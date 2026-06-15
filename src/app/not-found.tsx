import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link href="/" className={cn(buttonVariants())}>
        Return Home
      </Link>
    </div>
  )
}
