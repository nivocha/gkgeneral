import { requireAuth } from "@/lib/auth/session"
import { getSubscribers } from "@/features/newsletter/actions/subscriber-actions"
import SubscriberList from "./subscriber-list"

export const dynamic = "force-dynamic"
export const metadata = { title: "Subscribers | Admin" }

type Props = {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function SubscribersPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const search = sp.search
  const page = parseInt(sp.page ?? "1", 10)
  const { subscribers, total, pages } = await getSubscribers(page, 20, search)

  return (
    <SubscriberList
      subscribers={subscribers.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
      total={total}
      pages={pages}
      currentPage={page}
      search={search}
    />
  )
}
