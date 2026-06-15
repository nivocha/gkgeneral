"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import type { LucideIcon } from "lucide-react"
import { siteConfig } from "@/config"
import {
  Phone, Mail, MapPin, Clock, ArrowRight, Check, Loader2,
  MessageCircle, Share2, Globe, Play, ArrowUp,
  Zap, Sun, Droplets, Cable, Wrench, Factory, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHeaderCategories } from "@/features/products/queries"
import { subscribeAction } from "@/features/newsletter/actions"

const iconMap: Record<string, LucideIcon> = {
  Zap, Sun, Droplets, Cable, Wrench, Factory,
}

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping Information", href: "/shipping" },
  { label: "Returns Policy", href: "/returns" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
]

const customerLinks = [
  { label: "My Account", href: "/account" },
  { label: "Order History", href: "/account/orders" },
  { label: "Request Quote", href: "/contact" },
  { label: "Track Order", href: "/account/orders" },
  { label: "Product Support", href: "/contact" },
]

export function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subscribePending, setSubscribePending] = useState(false)
  const [subscribeError, setSubscribeError] = useState<string | null>(null)
  useEffect(() => setMounted(true), [])

  async function handleSubscribe(formData: FormData) {
    setSubscribePending(true)
    setSubscribeError(null)
    const result = await subscribeAction(formData)
    if (result.success) {
      setSubscribed(true)
    } else {
      setSubscribeError(result.message)
    }
    setSubscribePending(false)
  }

  const { data: categories = [] } = useHeaderCategories()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="border-t bg-background">
      {/* Newsletter */}
      <div className="border-b bg-muted/30">
        <div className="container py-10 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-lg font-semibold">Stay Updated</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Subscribe to receive product updates, industry news, and exclusive offers.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" /> Subscribed successfully!
              </div>
            ) : (
              <form action={handleSubscribe} className="flex gap-3">
                <Input
                  name="email"
                  placeholder="Enter your email"
                  className="flex-1 h-11"
                  type="email"
                  required
                />
                <Button type="submit" className="h-11 px-6 gap-2 flex-shrink-0" disabled={subscribePending}>
                  {subscribePending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Subscribing...</>
                  ) : (
                    <>Subscribe <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>
            )}
            {subscribeError && (
              <p className="text-sm text-destructive mt-1">{subscribeError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-14 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Company */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              {mounted ? (
                <Image
                  src={resolvedTheme === "dark" ? "/gk-logo-dark.svg" : "/gk-logo.svg"}
                  alt="GK General Supply"
                  width={180}
                  height={36}
                  className="h-10 w-auto"
                  priority
                />
              ) : (
                <div className="h-10 w-[180px]" />
              )}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              {siteConfig.description}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span>{siteConfig.contact.address}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span>{siteConfig.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span>{siteConfig.contact.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Categories</h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon || ""] || Package
                return (
                  <li key={cat.id}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                      {cat.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2.5">
              {customerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold mt-8 mb-3">Follow Us</h3>
            <div className="flex items-center gap-2">
              {[
                { icon: MessageCircle, href: "#", label: "Facebook" },
                { icon: Globe, href: "#", label: "Twitter" },
                { icon: Share2, href: "#", label: "LinkedIn" },
                { icon: Play, href: "#", label: "YouTube" },
              ].map((social) => {
                const SocialIcon = social.icon
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    aria-label={social.label}
                  >
                    <SocialIcon className="h-4 w-4" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t bg-muted/30">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved. | {siteConfig.business.registration} | Tax ID: {siteConfig.business.taxId}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/sitemap" className="hover:text-foreground transition-colors">Sitemap</Link>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={scrollToTop}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
