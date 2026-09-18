import type { Appointment } from '../../lib/types'

export default function UpcomingAppointments({ appts }: { appts: Appointment[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            Upcoming Appointments
          </h3>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {appts.length} {appts.length === 1 ? 'visit' : 'visits'}
        </span>
      </div>

      {/* Content */}
      {appts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No upcoming appointments
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            When you schedule consultations with healthcare providers, dates, times, and clinic details will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map((appt) => {
            const dateObj = appt.appointment_date ? new Date(appt.appointment_date) : null
            const month = dateObj
              ? dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
              : 'CAL'
            const day = dateObj ? dateObj.getDate() : '--'
            const time = dateObj
              ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : 'Scheduled'

            const doctorDisplay = appt.doctor_name
              ? (appt.doctor_name.toLowerCase().startsWith('dr')
                  ? appt.doctor_name
                  : `Dr. ${appt.doctor_name}`)
              : 'Medical Consultation'

            const hospitalDisplay = appt.hospital_name || 'Clinic / Hospital'

            return (
              <div
                key={appt.id}
                className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 transition flex items-start gap-3.5"
              >
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold tracking-wider leading-none">
                    {month}
                  </span>
                  <span className="text-base font-extrabold leading-tight">
                    {day}
                  </span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {doctorDisplay}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="truncate">{hospitalDisplay}</span>
                  </div>
                  {appt.notes && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 italic line-clamp-1">
                      Note: {appt.notes}
                    </p>
                  )}
                </div>

                {/* Time Badge */}
                <div className="shrink-0 text-right">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                    {time}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
