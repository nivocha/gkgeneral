import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth/session"
import { getAdminCmsPage } from "@/features/cms/actions/cms-actions"
import CmsPageForm from "../../cms-page-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit CMS Page | Admin" }

type Props = { params: Promise<{ id: string }> }

export default async function EditCmsPagePage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const page = await getAdminCmsPage(id)
  if (!page) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit CMS Page</h1>
      <CmsPageForm initial={page} />
    </div>
  )
}
