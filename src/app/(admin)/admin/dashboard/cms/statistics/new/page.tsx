import StatisticForm from "../statistic-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "New Statistic | CMS" }

export default function NewStatisticPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Statistic</h1>
      <StatisticForm />
    </div>
  )
}
