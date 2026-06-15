import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existingTestimonials = await prisma.testimonial.count()
  if (existingTestimonials > 0) {
    console.log("CMS data already seeded, skipping")
    return
  }

  const testimonials = [
    { name: "James Mwangi", title: "Operations Director", company: "East African Industries Ltd", content: "GK General Supply has been our primary equipment supplier for over 5 years. Their generators and industrial pumps are top quality.", rating: 5, sortOrder: 0, isActive: true },
    { name: "Amina Hassan", title: "Project Manager", company: "Dar es Salaam Construction Co", content: "The solar solutions from GK transformed our project sites. We reduced diesel costs by 60%.", rating: 5, sortOrder: 1, isActive: true },
    { name: "Peter Ochieng", title: "Plant Manager", company: "Lake Victoria Breweries", content: "We needed specialized industrial electrical equipment. GK delivered on time and within budget.", rating: 4, sortOrder: 2, isActive: true },
  ]
  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t })
  }
  console.log("✓ Testimonials seeded")

  const stats = [
    { label: "Products Available", value: "10,000+", sortOrder: 0, isActive: true },
    { label: "Happy Clients", value: "500+", sortOrder: 1, isActive: true },
    { label: "Years Experience", value: "15+", sortOrder: 2, isActive: true },
    { label: "Cities Covered", value: "26+", sortOrder: 3, isActive: true },
  ]
  for (const s of stats) {
    await prisma.siteStatistic.create({ data: s })
  }
  console.log("✓ Statistics seeded")

  const promotions = [
    { title: "Industry Solutions", description: "Comprehensive equipment and support for every sector.", badge: "Industry Solutions", linkText: "Browse Catalog", linkUrl: "/products", sortOrder: 0, isActive: true },
    { title: "Bulk Order Discounts", description: "Special pricing for businesses and contractors. Contact our sales team for custom quotes.", badge: "B2B Pricing", linkText: "Request Quote", linkUrl: "/contact", sortOrder: 1, isActive: true },
    { title: "Nationwide Installation", description: "Professional installation and maintenance services available across all major cities.", badge: "Service", linkText: "Learn More", linkUrl: "/contact", sortOrder: 2, isActive: true },
  ]
  for (const p of promotions) {
    await prisma.promotionBanner.create({ data: p })
  }
  console.log("✓ Promotions seeded")

  await prisma.$disconnect()
}

main().catch(console.error)
