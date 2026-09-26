import { events } from '@/data/events'
import OrganizerConsole from '@/components/OrganizerConsole'

export default function OrganizerPage() {
  return <OrganizerConsole allEvents={events} />
}
