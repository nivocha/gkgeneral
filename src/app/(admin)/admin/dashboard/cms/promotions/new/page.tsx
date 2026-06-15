import PromotionForm from "../promotion-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "New Promotion | CMS" }

export default function NewPromotionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Promotion</h1>
      <PromotionForm />
    </div>
  )
}
