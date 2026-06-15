import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, FileText, Heart, Bell, CreditCard, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const quickLinks = [
  { title: "Orders", description: "View your order history", icon: ShoppingCart, href: "/account/orders" },
  { title: "Payments", description: "View payment history", icon: CreditCard, href: "/account/payments" },
  { title: "Quotes", description: "Manage your quotations", icon: FileText, href: "/account/quotes" },
  { title: "Wishlist", description: "Your saved products", icon: Heart, href: "/account/wishlist" },
  { title: "Notifications", description: "View notifications", icon: Bell, href: "/account/notifications" },
]

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground mt-1">Welcome to your account portal.</p>
        </div>
        <Link href="/products" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.title} href={link.href}>
              <Card className="group cursor-pointer hover:border-primary transition-colors">
                <CardContent className="flex flex-col items-center text-center p-6">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">{link.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          No orders yet. Start by browsing our products.
        </CardContent>
      </Card>
    </div>
  )
}
