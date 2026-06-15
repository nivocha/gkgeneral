import { prisma } from "@/lib/prisma"

export type HeroSlide = {
  name: string
  brand: string
  tagline: string
  description: string
  reviewCount: number
  badge: string
  specs: string[]
  gradient: string
  iconName: string
  iconColor: string
  bgGlow: string
  slug: string
  image: string | null
}

export type HomepageProduct = {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  sku: string
  price: number | null
  comparePrice: number | null
  image: string | null
  isNew: boolean
  onSale: boolean
  isFeatured: boolean
  viewCount: number
  purchaseCount: number
  tags: string[]
  category: { id: string; name: string; slug: string } | null
  brand: { id: string; name: string; slug: string } | null
  reviewCount: number
}

export type HomepageCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  productCount: number
}

export type HomepageBrand = {
  id: string
  name: string
  slug: string
  logo: string | null
}

export type HomepageData = {
  featuredProducts: HomepageProduct[]
  trendingProducts: HomepageProduct[]
  categories: HomepageCategory[]
  brands: HomepageBrand[]
}

const categoryTheme: Record<string, {
  iconName: string; gradient: string; iconColor: string; bgGlow: string
}> = {
  generators: {
    iconName: "Zap",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    iconColor: "text-amber-500",
    bgGlow: "bg-amber-500/10",
  },
  solar: {
    iconName: "Sun",
    gradient: "from-yellow-500/20 via-yellow-500/5 to-transparent",
    iconColor: "text-yellow-500",
    bgGlow: "bg-yellow-500/10",
  },
  pumps: {
    iconName: "Droplets",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    iconColor: "text-blue-500",
    bgGlow: "bg-blue-500/10",
  },
  electrical: {
    iconName: "Cable",
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    iconColor: "text-red-500",
    bgGlow: "bg-red-500/10",
  },
  tools: {
    iconName: "Wrench",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    iconColor: "text-emerald-500",
    bgGlow: "bg-emerald-500/10",
  },
  industrial: {
    iconName: "Factory",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    iconColor: "text-violet-500",
    bgGlow: "bg-violet-500/10",
  },
}

const defaultTheme = categoryTheme.generators

export function buildHeroSlides(products: HomepageProduct[]): HeroSlide[] {
  return products.slice(0, 6).map((p) => {
    const catSlug = p.category?.slug || ""
    const theme = categoryTheme[catSlug] || defaultTheme
    const badge = p.isNew ? "New" : p.onSale ? "Sale" : "Featured"
    const specs = p.tags.length > 0 ? p.tags.slice(0, 3) : []
    const tagline = p.category ? `Premium ${p.category.name}` : "Featured Product"
    return {
      name: p.name,
      brand: p.brand?.name || "",
      tagline,
      description: p.shortDescription || `${p.name} — high-quality industrial equipment.`,
      reviewCount: p.reviewCount,
      badge,
      specs,
      image: p.image,
      ...theme,
      slug: p.slug,
    }
  })
}

export async function getHomepageData(): Promise<HomepageData> {
  const where = { deletedAt: null, status: "Active" as const, isPublished: true }

  const productSelect = {
    id: true,
    name: true,
    slug: true,
    shortDescription: true,
    sku: true,
    price: true,
    comparePrice: true,
    isNew: true,
    onSale: true,
    isFeatured: true,
    viewCount: true,
    purchaseCount: true,
    tags: true,
    category: { select: { id: true, name: true, slug: true } },
    brand: { select: { id: true, name: true, slug: true } },
    images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
    _count: { select: { reviews: true } },
  } as const

  const [featuredProducts, trendingProducts, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { ...where, isFeatured: true },
      select: productSelect,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where,
      select: productSelect,
      take: 8,
      orderBy: [{ purchaseCount: "desc" }, { viewCount: "desc" }],
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        icon: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, logo: true },
    }),
  ])

  return {
    featuredProducts: featuredProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      sku: p.sku,
      price: p.price ? Number(p.price) : null,
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      image: p.images[0]?.url || null,
      isNew: p.isNew,
      onSale: p.onSale,
      isFeatured: p.isFeatured,
      viewCount: p.viewCount,
      purchaseCount: p.purchaseCount,
      tags: p.tags,
      category: p.category,
      brand: p.brand,
      reviewCount: p._count.reviews,
    })),
    trendingProducts: trendingProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      sku: p.sku,
      price: p.price ? Number(p.price) : null,
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      image: p.images[0]?.url || null,
      isNew: p.isNew,
      onSale: p.onSale,
      isFeatured: p.isFeatured,
      viewCount: p.viewCount,
      purchaseCount: p.purchaseCount,
      tags: p.tags,
      category: p.category,
      brand: p.brand,
      reviewCount: p._count.reviews,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      icon: c.icon,
      productCount: c._count.products,
    })),
    brands,
  }
}
