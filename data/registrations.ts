// Seed data for registrations, so the "My Registrations" and Organizer
// pages have something real to display before participants build the
// actual registration flow (Task 2 and Task 3).

export type RegistrationStatus = 'confirmed' | 'cancelled'

export interface Registration {
  id: string
  eventId: string
  studentId: string
  status: RegistrationStatus
  registeredAt: string // ISO date string
}

// NOTE FOR PARTICIPANTS: this array is the "database" of registrations.
// Task 2 (Registration) means pushing new items into this array when a
// student registers. Task 3 (Cancellation) means updating an item's
// status here. Keep using this same array — don't create a second store.
export const registrations: Registration[] = [
  {
    id: 'reg-01',
    eventId: 'evt-01',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-09-10T10:15:00',
  },
  {
    id: 'reg-02',
    eventId: 'evt-04',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-08-20T09:00:00',
  },
  {
    id: 'reg-03',
    eventId: 'evt-09',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-09-12T18:40:00',
  },
]

/** Simple lookup used by the placeholder "My Registrations" page. */
export function getRegistrationsForStudent(studentId: string): Registration[] {
  return registrations.filter((reg) => reg.studentId === studentId)
}

/**
 * Only 'confirmed' registrations count toward occupancy/duplicate checks.
 * A 'cancelled' one must never block a re-registration or count as an
 * active seat.
 */
export function getConfirmedRegistrationsForEvent(
  eventId: string,
): Registration[] {
  return registrations.filter(
    (reg) => reg.eventId === eventId && reg.status === 'confirmed',
  )
}

export function hasConfirmedRegistration(
  eventId: string,
  studentId: string,
): boolean {
  return registrations.some(
    (reg) =>
      reg.eventId === eventId &&
      reg.studentId === studentId &&
      reg.status === 'confirmed',
  )
}

/** Generates a fresh, collision-free registration id. */
export function generateRegistrationId(): string {
  let n = registrations.length + 1
  while (registrations.some((r) => r.id === `reg-${String(n).padStart(2, '0')}`)) {
    n += 1
  }
  return `reg-${String(n).padStart(2, '0')}`
}
