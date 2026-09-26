'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { cancelRegistration } from '@/app/actions'
import { isPastEvent, CampusEvent } from '@/data/events'
import { Registration } from '@/data/registrations'
import StatusBadge from './StatusBadge'
import EmptyState from './EmptyState'

interface EnrichedReg {
  reg: Registration
  event: CampusEvent
}

export default function MyRegistrationsConsole({ allRegistrations }: { allRegistrations: EnrichedReg[] }) {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (currentUser.role !== 'student') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState title="This page is for students" description="Switch to a student account from the top-right menu to see registered events." />
      </section>
    )
  }

  const mine = allRegistrations.filter(({ reg }) => reg.studentId === currentUser.id)
  const upcoming = mine.filter(({ reg, event }) => reg.status !== 'cancelled' && !event.cancelled && !isPastEvent(event))
  const past = mine.filter(({ reg, event }) => reg.status === 'cancelled' || event.cancelled || isPastEvent(event))

  function handleCancel(registrationId: string) {
    startTransition(async () => {
      await cancelRegistration(registrationId, currentUser.id)
      router.refresh()
    })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function renderCard({ reg, event }: EnrichedReg) {
    const isPast = reg.status === 'cancelled' || event.cancelled || isPastEvent(event)
    return (
      <li key={reg.id} className="card-surface" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Link href={`/events/${event.id}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, textDecoration: 'none' }}>
            {event.name}
          </Link>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>{formatDate(event.date)} · {event.venue}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={reg.status === 'cancelled' ? 'cancelled' : event.cancelled ? 'cancelled' : isPastEvent(event) ? 'past' : 'open'} />
          <button className="btn btn-secondary" disabled={isPast || isPending} onClick={() => handleCancel(reg.id)}>
            {isPending ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
      </li>
    )
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">signed up as {currentUser.name}</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>My registrations</h1>
        <p style={{ marginTop: 8 }}>Everything you've registered for, split into upcoming and past.</p>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Once you register for an event, it'll show up here."
          action={<Link href="/events" className="btn btn-primary">Browse events</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Upcoming</h2>
            {upcoming.length === 0 ? <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No upcoming registrations.</p> : <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{upcoming.map(renderCard)}</ul>}
          </div>
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Past</h2>
            {past.length === 0 ? <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No past registrations.</p> : <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{past.map(renderCard)}</ul>}
          </div>
        </div>
      )}
    </section>
  )
}
