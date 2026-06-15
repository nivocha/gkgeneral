import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { siteConfig } from "@/config"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Us — GK General Supply",
  description: "Get in touch with our team for inquiries, quotes, and support. We're here to help with all your industrial equipment needs.",
}

const contactInfo = [
  { icon: Phone, label: "Phone", value: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phone}` },
  { icon: Mail, label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
  { icon: MapPin, label: "Address", value: siteConfig.contact.address },
  { icon: Clock, label: "Business Hours", value: "Mon - Sat: 8:00 AM - 6:00 PM" },
]

export default function ContactPage() {
  return (
    <div className="container py-12 lg:py-16">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Have a question or need a quote? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {contactInfo.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium hover:text-primary">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{item.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Send us a message</h2>
              </div>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
