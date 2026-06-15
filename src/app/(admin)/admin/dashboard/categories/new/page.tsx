import CategoryForm from "../category-form"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const metadata = { title: "New Category | Admin" }

export default async function NewCategoryPage() {
  await requireAuth()
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Category</h1>
      <CategoryForm parents={parents} />
    </div>
  )
}
