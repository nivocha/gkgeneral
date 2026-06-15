"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  Menu, Search, ShoppingCart, User, X, ChevronDown,
  ChevronRight, ChevronLeft, Zap, Sun, Moon, Package,
  Wind, Droplets, Cable, Wrench, Factory, Phone, Mail,
  MapPin, Clock, LogIn, LogOut, LayoutDashboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { useSession } from "@/components/providers/session-provider"
import { useCartStore } from "@/features/carts/store"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config"
import { useHeaderCategories } from "@/features/products/queries"

const iconMap: Record<string, LucideIcon> = {
  Zap, Sun, Droplets, Cable, Wrench, Factory,
}

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Request Quote", href: "/contact" },
]

export function Header() {
  const { user } = useSession()
  const { itemCount } = useCartStore()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeMega, setActiveMega] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useHeaderCategories()

  useEffect(() => setMounted(true), [])

  const handleMegaEnter = (name: string) => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current)
    setActiveMega(name)
  }

  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setActiveMega(null), 150)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="hidden lg:block border-b bg-muted/30">
        <div className="container flex h-9 items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {siteConfig.contact.phone}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {siteConfig.contact.email}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {siteConfig.contact.address}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Mon - Sat: 8:00 AM - 6:00 PM
            </span>
            {user && user.role !== "customer" && (
              <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          {mounted ? (
            <Image
              src={resolvedTheme === "dark" ? "/gk-logo-dark.svg" : "/gk-logo.svg"}
              alt="GK General Supply"
              width={180}
              height={36}
              className="h-9 w-auto"
              priority
            />
          ) : (
            <div className="h-9 w-[180px]" />
          )}
        </Link>

        {/* Mega navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-1" onMouseLeave={handleMegaLeave}>
          <Link
            href="/"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Home
          </Link>
          {categories.map((cat) => {
            const CatIcon = iconMap[cat.icon || ""] || Package
            return (
              <div
                key={cat.slug}
                className="relative"
                onMouseEnter={() => handleMegaEnter(cat.slug)}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    activeMega === cat.slug ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {cat.name}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {activeMega === cat.slug && (
                  <div
                    className="absolute left-0 top-full pt-2"
                    onMouseEnter={() => handleMegaEnter(cat.slug)}
                  >
                    <div className="w-64 rounded-lg border bg-popover p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <CatIcon className="h-4 w-4 text-primary" />
                        <Link href={`/categories/${cat.slug}`} className="text-sm font-semibold hover:text-primary">
                          All {cat.name}
                        </Link>
                      </div>
                      <ul className="space-y-1">
                        {cat.items.length > 0 ? cat.items.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/categories/${cat.slug}?type=${item.slug}`}
                              className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            >
                              {item.name}
                            </Link>
                          </li>
                        )) : (
                          <li>
                            <Link
                              href={`/categories/${cat.slug}`}
                              className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                            >
                              Browse Products
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <Link
            href="/products"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/products" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            All Products
          </Link>
          <Link
            href="/contact"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/contact" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchInputRef.current?.focus(), 100) }}>
            <Search className="h-5 w-5" />
          </Button>

          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <Link href="/account">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t bg-background">
          <div className="container py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search 10,000+ industrial products..."
                className="pl-9 h-12 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) router.push(`/search?q=${encodeURIComponent(val)}`)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu with Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
            <SheetTitle className="text-lg">Menu</SheetTitle>
            <div className="flex items-center gap-1">
              {mounted && (
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          {/* User section */}
          <div className="px-4 py-3 border-b shrink-0">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name || "Account"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/account">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <LogIn className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sign In</p>
                  <p className="text-xs text-muted-foreground">Access your account</p>
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1">Categories</p>

              {categories.map((cat) => {
                const CatIcon = iconMap[cat.icon || ""] || Package
                return (
                  <div key={cat.slug}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-3 p-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CatIcon className="h-4 w-4 text-primary shrink-0" />
                      <span>{cat.name}</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground shrink-0" />
                    </Link>
                  </div>
                )
              })}

              <Link
                href="/products"
                className="flex items-center gap-3 p-2 text-sm font-medium text-primary rounded-md hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package className="h-4 w-4 shrink-0" />
                <span>All Products</span>
              </Link>
            </div>

            <div className="px-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1">Quick Links</p>
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-2 text-sm text-muted-foreground rounded-md hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact info footer */}
          <div className="border-t p-4 space-y-2 shrink-0 bg-muted/30">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" /> {siteConfig.contact.phone}
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" /> {siteConfig.contact.email}
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" /> {siteConfig.contact.address}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
