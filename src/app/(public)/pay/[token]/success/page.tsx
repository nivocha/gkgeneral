import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Payment Successful | GK General Supply",
}

export default function PaySuccessPage() {
  return (
    <div className="container max-w-lg mx-auto py-20 text-center">
      <div className="rounded-full bg-green-100 dark:bg-green-900/20 h-20 w-20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Payment Initiated!</h1>
      <p className="text-muted-foreground mb-2">
        Your payment is being processed. You will receive a confirmation once it is complete.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Check your phone for the payment prompt if you selected Mobile Money.
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  )
}
