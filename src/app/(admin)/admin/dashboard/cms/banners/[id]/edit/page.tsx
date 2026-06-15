import { notFound } from "next/navigation"
import { getHeroBanner } from "@/features/homepage/actions/manage-hero-banners"
import HeroBannerForm from "../../banner-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Banner | CMS" }

type Props = { params: Promise<{ id: string }> }

export default async function EditBannerPage({ params }: Props) {
  const { id } = await params
  const banner = await getHeroBanner(id)
  if (!banner) notFound()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Banner</h1>
      <HeroBannerForm initial={banner} />
    </div>
  )
}
