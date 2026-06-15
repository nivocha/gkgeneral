import { notFound } from "next/navigation"
import { getPromotionBanner } from "@/features/homepage/actions/manage-promotions"
import PromotionForm from "../../promotion-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Promotion | CMS" }

type Props = { params: Promise<{ id: string }> }

export default async function EditPromotionPage({ params }: Props) {
  const { id } = await params
  const banner = await getPromotionBanner(id)
  if (!banner) notFound()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Promotion</h1>
      <PromotionForm initial={banner} />
    </div>
  )
}
