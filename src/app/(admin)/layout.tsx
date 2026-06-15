"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Settings, FileText, Warehouse, MapPin, CreditCard,
  Shield, Activity, Bell, ChevronLeft, Menu,
  LogOut, User, ChartPie, Layout, Tag, Mail, UserPlus, Store
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "@/components/providers/session-provider"
import { SignOutButton } from "@/components/sign-out-button"

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/products", label: "Products", icon: Package },
  { href: "/admin/dashboard/categories", label: "Categories", icon: MapPin },
  { href: "/admin/dashboard/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/dashboard/warehouses", label: "Warehouses", icon: MapPin },
  { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/dashboard/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/dashboard/customers", label: "Customers", icon: Users },
  { href: "/admin/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/dashboard/users", label: "Users", icon: Shield },
  { href: "/admin/dashboard/roles", label: "Roles", icon: Activity },
  { href: "/admin/dashboard/cms", label: "Content", icon: Layout },
  { href: "/admin/dashboard/brands", label: "Brands", icon: Tag },
  { href: "/admin/dashboard/contact", label: "Contact", icon: Mail },
  { href: "/admin/dashboard/subscribers", label: "Subscribers", icon: UserPlus },
  { href: "/admin/dashboard/audit-log", label: "Audit Log", icon: ChartPie },
  { href: "/admin/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/", label: "Frontstore", icon: Store },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const { user } = useSession()

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <aside className={cn(
        "fixed left-0 top-0 z-40 h-full border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        "max-lg:-translate-x-full max-lg:data-[open=true]:translate-x-0"
      )} data-open={mobileOpen || undefined}>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <Link href="/admin/dashboard" className="text-lg font-bold">
              <span className="text-primary">GK</span> Admin
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="max-lg:hidden">
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== "/admin/dashboard" && link.href !== "/" && pathname.startsWith(link.href))
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
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {!collapsed && (
                <>
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
                </>
              )}
            </div>
            <SignOutButton variant="ghost" className="h-9 w-9 p-0" iconOnly />
          </div>
        </div>
      </aside>
      <main className={cn(
        "flex-1 transition-all duration-300",
        "ml-0 lg:ml-64",
        collapsed && "lg:ml-16"
      )}>
        <div className="p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
