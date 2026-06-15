"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generatePaymentLink } from "@/features/payments/actions/payment-links"
import { Link2, Copy, Check, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

export function PaymentLinkGenerator({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const result = await generatePaymentLink(orderId)
      setLinkUrl(result.url)
      toast.success("Payment link generated!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate link")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(linkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Link copied to clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          Payment Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Generate a shareable payment link to send via WhatsApp, SMS, or email.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
          {loading ? "Generating..." : "Generate Payment Link"}
        </Button>
        {linkUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input value={linkUrl} readOnly className="text-xs" />
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Pay for your order here: ${linkUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                <a href={`sms:?body=${encodeURIComponent(`Pay for your order: ${linkUrl}`)}`}>
                  <MessageCircle className="h-4 w-4" />
                  SMS
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
