"use server"

import { prisma } from "@/lib/prisma"

export async function getHomepageContent() {
  const [heroBanners, testimonials, statistics, promotions] = await Promise.all([
    prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.siteStatistic.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.promotionBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  return {
    heroBanners: heroBanners.map((b) => ({
      ...b,
      specs: [b.spec1, b.spec2, b.spec3].filter(Boolean) as string[],
    })),
    testimonials,
    statistics,
    promotions,
  }
}
