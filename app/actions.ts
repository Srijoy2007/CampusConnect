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
export async function cancelRegistration(
  registrationId: string,
  studentId: string,
): Promise<ActionResult> {
  const reg = registrations.find((r) => r.id === registrationId)
  if (!reg) return { ok: false, error: 'Registration not found.' }
  if (reg.studentId !== studentId) {
    return { ok: false, error: "You can't cancel someone else's registration." }
  }
  if (reg.status === 'cancelled') return { ok: true }

  reg.status = 'cancelled'
  const event = getEventById(reg.eventId)
  // clamp so seats can never exceed capacity, even on a double-cancel
  if (event) {
    event.seatsAvailable = Math.min(event.capacity, event.seatsAvailable + 1)
  }

  revalidateEverything(reg.eventId)
  return { ok: true }
}

import {
  createEvent as createEventInStore,
  updateEvent as updateEventInStore,
  cancelEvent as cancelEventInStore,
  validateEventInput,
  CreateEventInput,
  CampusEvent,
} from '@/data/events'

export async function createEventAction(
  input: CreateEventInput,
): Promise<ActionResult> {
  const error = validateEventInput(input)
  if (error) return { ok: false, error }
  createEventInStore(input)
  revalidateEverything()
  return { ok: true }
}

export async function updateEventAction(
  id: string,
  updates: Partial<Omit<CampusEvent, 'id' | 'organizerId'>>,
): Promise<ActionResult> {
  const error = validateEventInput({
    name: updates.name ?? '',
    date: updates.date ?? '',
    venue: updates.venue ?? '',
    capacity: updates.capacity ?? 0,
  })
  if (error) return { ok: false, error }
  const ok = updateEventInStore(id, updates)
  if (!ok) return { ok: false, error: 'Event not found.' }
  revalidateEverything(id)
  return { ok: true }
}

export async function cancelEventAction(id: string): Promise<ActionResult> {
  const ok = cancelEventInStore(id)
  if (!ok) return { ok: false, error: 'Event not found.' }
  revalidateEverything(id)
  return { ok: true }
}
