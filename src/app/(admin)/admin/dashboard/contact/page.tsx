import { requireAuth } from "@/lib/auth/session"
import { getContactSubmissions } from "@/features/contact/actions/contact-actions"
import ContactList from "./contact-list"

export const dynamic = "force-dynamic"
export const metadata = { title: "Contact Submissions | Admin" }

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function ContactPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page ?? "1", 10)
  const { submissions, total, pages } = await getContactSubmissions(page)

  return (
    <ContactList
      submissions={submissions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
      total={total}
      pages={pages}
      currentPage={page}
    />
  )
}
