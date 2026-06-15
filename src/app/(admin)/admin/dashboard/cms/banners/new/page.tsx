import HeroBannerForm from "../banner-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "New Banner | CMS" }

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Hero Banner</h1>
      <HeroBannerForm />
    </div>
  )
}
