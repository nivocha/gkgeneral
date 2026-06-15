import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth/session"
import { getBrand } from "@/features/brands/actions/manage-brands"
import BrandForm from "../../brand-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Brand | Admin" }

type Props = { params: Promise<{ id: string }> }

export default async function EditBrandPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const brand = await getBrand(id)
  if (!brand) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Brand</h1>
      <BrandForm initial={brand} />
    </div>
  )
}
