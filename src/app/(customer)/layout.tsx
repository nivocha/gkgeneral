"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, ShoppingCart, FileText, Heart,
  MapPin, Bell, User, Settings, LogOut, Menu, X, CreditCard, Shield
} from "lucide-react"
import { useState } from "react"
import { useSession } from "@/components/providers/session-provider"
import { SignOutButton } from "@/components/sign-out-button"

const sidebarLinks = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: ShoppingCart },
  { href: "/account/payments", label: "Payments", icon: CreditCard },
  { href: "/account/quotes", label: "Quotes", icon: FileText },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/settings", label: "Settings", icon: Settings },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useSession()

  const links = user?.role === "super_admin"
    ? [...sidebarLinks, { href: "/admin/dashboard", label: "Admin Dashboard", icon: Shield }]
    : sidebarLinks

  return (
    <div className="flex min-h-screen">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transform transition-transform lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link href="/account" className="text-lg font-bold">
            <span className="text-primary">GK</span> Portal
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <SignOutButton variant="ghost" className="w-full justify-start" />
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground hidden sm:block">{user?.name}</p>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
