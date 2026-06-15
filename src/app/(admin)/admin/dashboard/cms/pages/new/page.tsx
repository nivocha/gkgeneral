import { requireAuth } from "@/lib/auth/session"
import CmsPageForm from "../cms-page-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "New CMS Page | Admin" }

export default async function NewCmsPagePage() {
  await requireAuth()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New CMS Page</h1>
      <CmsPageForm />
    </div>
  )
}
