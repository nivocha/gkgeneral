import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CategoryDetailContent } from "./content"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ type?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    select: { name: true, description: true },
  })
  if (!category) return { title: "Category Not Found" }
  return {
    title: `${category.name} — GK General Supply`,
    description: category.description || `Browse our range of ${category.name} products.`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { type } = await searchParams

  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parentId: true,
    },
  })

  if (!category) notFound()

  let typeId: string | null = null
  let typeName: string | null = null
  if (type) {
    const sub = await prisma.category.findFirst({
      where: { slug: type, parentId: category.id, isActive: true },
      select: { id: true, name: true },
    })
    typeId = sub?.id || null
    typeName = sub?.name || null
  }

  return <CategoryDetailContent category={category} type={type || null} typeName={typeName} typeId={typeId} />
}
