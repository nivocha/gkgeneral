import { notFound } from "next/navigation"
import { getSiteStatistic } from "@/features/homepage/actions/manage-statistics"
import StatisticForm from "../../statistic-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Statistic | CMS" }

type Props = { params: Promise<{ id: string }> }

export default async function EditStatisticPage({ params }: Props) {
  const { id } = await params
  const statistic = await getSiteStatistic(id)
  if (!statistic) notFound()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Statistic</h1>
      <StatisticForm initial={statistic} />
    </div>
  )
}
