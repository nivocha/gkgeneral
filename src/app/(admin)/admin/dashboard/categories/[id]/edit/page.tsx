import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import CategoryForm from "../../category-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Category | Admin" }

type Props = { params: Promise<{ id: string }> }

export default async function EditCategoryPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) notFound()

  const parents = await prisma.category.findMany({
    where: { parentId: null, id: { not: id } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Category</h1>
      <CategoryForm parents={parents} initial={category} />
    </div>
  )
}
