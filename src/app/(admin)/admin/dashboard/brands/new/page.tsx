import { requireAuth } from "@/lib/auth/session"
import BrandForm from "../brand-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "New Brand | Admin" }

export default async function NewBrandPage() {
  await requireAuth()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Brand</h1>
      <BrandForm />
    </div>
  )
}
