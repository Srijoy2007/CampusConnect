import { registrations } from '@/data/registrations'
import { getEventById } from '@/data/events'
import MyRegistrationsConsole from '@/components/MyRegistrationsConsole'

export default function RegistrationsPage() {
  const enriched = registrations
    .map((reg) => {
      const event = getEventById(reg.eventId)
      return event ? { reg, event } : null
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  return <MyRegistrationsConsole allRegistrations={enriched} />
}
