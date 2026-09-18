interface SummaryCardsProps {
  docsCount: number
  eventsCount: number
  medsCount: number
  apptCount: number
}

export default function SummaryCards({
  docsCount,
  eventsCount,
  medsCount,
  apptCount,
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Medical Documents',
      count: docsCount,
      description: 'Reports, scans & records',
      tag: 'On file',
      color: 'blue',
      icon: (
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    },
    {
      title: 'Timeline Events',
      count: eventsCount,
      description: 'Procedures & diagnoses',
      tag: 'Chronological',
      color: 'purple',
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    },
    {
      title: 'Active Medicines',
      count: medsCount,
      description: 'Current prescriptions',
      tag: 'Prescriptions',
      color: 'emerald',
      icon: (
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      bgClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      title: 'Upcoming Appointments',
      count: apptCount,
      description: 'Consultations & visits',
      tag: 'Scheduled',
      color: 'amber',
      icon: (
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${card.bgClass}`}>
              {card.icon}
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {card.tag}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {card.count}
            </div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {card.title}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {card.description}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
