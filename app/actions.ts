'use server'

import { revalidatePath } from 'next/cache'
import {
  getEventById,
  isPastEvent,
  isFullEvent,
} from '@/data/events'
import {
  registrations,
  generateRegistrationId,
  hasConfirmedRegistration,
} from '@/data/registrations'

export type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateEverything(eventId?: string) {
  revalidatePath('/')
  revalidatePath('/events')
  revalidatePath('/registrations')
  revalidatePath('/organizer')
  if (eventId) revalidatePath(`/events/${eventId}`)
}

export async function registerForEvent(
  eventId: string,
  studentId: string,
): Promise<ActionResult> {
  if (!studentId) {
    return { ok: false, error: 'You need to be logged in as a student to register.' }
  }

  const event = getEventById(eventId)
  if (!event) return { ok: false, error: 'This event no longer exists.' }
  if (event.cancelled) return { ok: false, error: 'This event has been cancelled.' }
  if (isPastEvent(event)) return { ok: false, error: 'This event has already happened.' }
  if (isFullEvent(event)) return { ok: false, error: 'This event is full.' }


  if (hasConfirmedRegistration(eventId, studentId)) {
    return { ok: false, error: "You're already registered for this event." }
  }

  registrations.push({
    id: generateRegistrationId(),
    eventId,
    studentId,
    status: 'confirmed',
    registeredAt: new Date().toISOString(),
  })
  event.seatsAvailable -= 1

  revalidateEverything(eventId)
  return { ok: true }
}
