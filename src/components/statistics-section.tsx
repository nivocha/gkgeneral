type StatisticData = {
  id: string
  label: string
  value: string
  prefix: string | null
  suffix: string | null
  iconName: string | null
}

export function StatisticsSection({ statistics }: { statistics: StatisticData[] }) {
  if (statistics.length === 0) return null

  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statistics.map((stat) => (
            <div key={stat.id} className="text-center space-y-2">
              <p className="text-4xl sm:text-5xl font-bold text-primary">
                {stat.prefix}{stat.value}{stat.suffix}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
