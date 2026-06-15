import Link from "next/link"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Image, Megaphone, MessageSquare, BarChart3, FileText, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Content Management | Admin" }

export default async function CMSPage() {
  await requireAuth()
  const [bannersCount, promotionsCount, testimonialsCount, statsCount, pagesCount] = await Promise.all([
    prisma.heroBanner.count(),
    prisma.promotionBanner.count(),
    prisma.testimonial.count(),
    prisma.siteStatistic.count(),
    prisma.cmsPage.count(),
  ])

  const sections = [
    { href: "/admin/dashboard/cms/banners", label: "Hero Banners", icon: Image, count: bannersCount, desc: "Homepage hero slides" },
    { href: "/admin/dashboard/cms/promotions", label: "Promotions", icon: Megaphone, count: promotionsCount, desc: "Promotional banners & offers" },
    { href: "/admin/dashboard/cms/testimonials", label: "Testimonials", icon: MessageSquare, count: testimonialsCount, desc: "Customer testimonials" },
    { href: "/admin/dashboard/cms/statistics", label: "Statistics", icon: BarChart3, count: statsCount, desc: "Site achievement counters" },
    { href: "/admin/dashboard/cms/pages", label: "Pages", icon: FileText, count: pagesCount, desc: "CMS content pages" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Content Management</h1>
      <p className="text-muted-foreground">Manage homepage content and site-wide settings</p>
      <div className="grid sm:grid-cols-2 gap-6">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    {s.label}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{s.count}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
