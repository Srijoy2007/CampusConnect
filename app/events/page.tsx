import { events } from '@/data/events'
import EventsBrowser from '@/components/EventsBrowser'

export default function EventsPage() {
  return <EventsBrowser allEvents={events} />
}
