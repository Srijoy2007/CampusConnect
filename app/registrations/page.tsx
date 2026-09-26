'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { getRegistrationsForStudent, Registration } from '@/data/registrations'
import { getEventById, isPastEvent, CampusEvent } from '@/data/events'
import { cancelRegistration } from '@/app/actions'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

type Row = { reg: Registration; event: CampusEvent }

export default function RegistrationsPage() {
  const { currentUser } = useAuth()

  if (currentUser.role !== 'student') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for students"
          description="Switch to a student account from the top-right menu to see registered events."
        />
      </section>
    )
  }

  return <RegistrationsList studentId={currentUser.id} studentName={currentUser.name} />
}

function RegistrationsList({
  studentId,
  studentName,
}: {
  studentId: string
  studentName: string
}) {
  // Seed local state once from the server-side data. From here on, a
  // successful cancel updates this local copy directly instead of
  // hoping a server re-render lands in time.
  const [rows, setRows] = useState<Row[]>(() =>
    getRegistrationsForStudent(studentId)
      .map((reg) => ({ reg, event: getEventById(reg.eventId) }))
      .filter((row): row is Row => !!row.event && !row.event.cancelled),
  )

  function handleCancelled(registrationId: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.reg.id === registrationId
          ? { ...row, reg: { ...row.reg, status: 'cancelled' } }
          : row,
      ),
    )
  }

  // A cancelled registration moves to Past regardless of the event's date.
  const upcoming = useMemo(
    () =>
      rows
        .filter(({ reg, event }) => reg.status !== 'cancelled' && !isPastEvent(event))
        .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime()),
    [rows],
  )

  const past = useMemo(
    () =>
      rows
        .filter(({ reg, event }) => reg.status === 'cancelled' || isPastEvent(event))
        .sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime()),
    [rows],
  )

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">signed up as {studentName}</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>My registrations</h1>
        <p style={{ marginTop: 8 }}>Everything you've registered for.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Once you register for an event, it'll show up here."
          action={
            <Link href="/events" className="btn btn-primary">
              Browse events
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <RegistrationGroup
            title="Upcoming"
            rows={upcoming}
            studentId={studentId}
            emptyText="Nothing upcoming."
            onCancelled={handleCancelled}
          />
          <RegistrationGroup
            title="Past"
            rows={past}
            studentId={studentId}
            emptyText="No past events yet."
            onCancelled={handleCancelled}
          />
        </div>
      )}
    </section>
  )
}

function RegistrationGroup({
  title,
  rows,
  studentId,
  emptyText,
  onCancelled,
}: {
  title: string
  rows: Row[]
  studentId: string
  emptyText: string
  onCancelled: (registrationId: string) => void
}) {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{emptyText}</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(({ reg, event }) => (
            <RegistrationRow
              key={reg.id}
              reg={reg}
              event={event}
              studentId={studentId}
              onCancelled={onCancelled}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function RegistrationRow({
  reg,
  event,
  studentId,
  onCancelled,
}: {
  reg: Registration
  event: CampusEvent
  studentId: string
  onCancelled: (registrationId: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const badgeStatus =
    reg.status === 'cancelled'
      ? 'cancelled'
      : isPastEvent(event)
        ? 'past'
        : 'open'

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelRegistration(reg.id, studentId)
      if (!result.ok) {
        setError(result.error)
      } else {
        onCancelled(reg.id)
      }
    })
  }

  return (
    <li
      className="card-surface"
      style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <Link
          href={`/events/${event.id}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 17,
            textDecoration: 'none',
          }}
        >
          {event.name}
        </Link>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>
          {new Date(event.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}{' '}
          · {event.venue}
        </div>
        {error && (
          <div style={{ fontSize: 13, color: 'var(--rust)', marginTop: 4 }}>
            {error}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge status={badgeStatus} />
        <button
          className="btn btn-secondary"
          disabled={reg.status === 'cancelled' || isPending}
          onClick={handleCancel}
          title={
            reg.status === 'cancelled'
              ? 'Already cancelled'
              : 'Cancel this registration'
          }
        >
          {isPending ? 'Cancelling…' : reg.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
        </button>
      </div>
    </li>
  )
}
