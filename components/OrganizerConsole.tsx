'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { createEventAction, updateEventAction, cancelEventAction } from '@/app/actions'
import { EventCategory, CampusEvent } from '@/data/events'
import EmptyState from './EmptyState'
import StatusBadge from './StatusBadge'

const CATEGORIES: EventCategory[] = ['Tech', 'Cultural', 'Sports', 'Workshop', 'Career', 'Music']

interface FormState {
  name: string
  description: string
  date: string
  venue: string
  category: EventCategory
  capacity: string
}

const EMPTY_FORM: FormState = {
  name: '', description: '', date: '', venue: '', category: 'Tech', capacity: '',
}

export default function OrganizerConsole({ allEvents }: { allEvents: CampusEvent[] }) {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  if (currentUser.role !== 'organizer') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for organizers"
          description="Switch to an organizer account from the top-right menu to manage events."
        />
      </section>
    )
  }

  const myEvents = allEvents.filter((e) => e.organizerId === currentUser.id)

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
    setFormOpen(true)
  }

  function openEditForm(event: CampusEvent) {
    setForm({
      name: event.name,
      description: event.description,
      date: event.date.slice(0, 16),
      venue: event.venue,
      category: event.category,
      capacity: String(event.capacity),
    })
    setEditingId(event.id)
    setError(null)
    setFormOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const capacityNum = Number(form.capacity)

    startTransition(async () => {
      const result = editingId
        ? await updateEventAction(editingId, {
            name: form.name,
            description: form.description,
            date: form.date,
            venue: form.venue,
            category: form.category,
            capacity: capacityNum,
          })
        : await createEventAction({
            name: form.name,
            description: form.description,
            date: form.date,
            venue: form.venue,
            category: form.category,
            capacity: capacityNum,
            organizerId: currentUser.id,
          })

      if (!result.ok) {
        setError(result.error)
        return
      }
      setFormOpen(false)
      router.refresh()
    })
  }

  function handleCancel(id: string) {
    if (!confirm('Cancel this event? Students will no longer see it.')) return
    startTransition(async () => {
      await cancelEventAction(id)
      router.refresh()
    })
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow-tag">organizer console</span>
          <h1 style={{ fontSize: 30, marginTop: 10 }}>Manage your events</h1>
          <p style={{ marginTop: 8 }}>Create, edit, and cancel the events your department posts.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateForm} disabled={isPending}>
          + New event
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="card-surface" style={{ padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 18 }}>{editingId ? 'Edit event' : 'New event'}</h2>
          {error && <p style={{ color: 'var(--rust)', fontSize: 13.5 }}>{error}</p>}
          <input placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inputStyle, flex: '1 1 200px' }} />
            <input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} style={{ ...inputStyle, flex: '1 1 160px' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })} style={{ ...inputStyle, flex: '1 1 160px' }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={1} placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} style={{ ...inputStyle, flex: '1 1 120px' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {myEvents.length === 0 ? (
        <EmptyState title="No events posted yet" description="Once you create an event, it'll show up here." />
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myEvents.map((event) => {
            const status = event.cancelled ? 'cancelled' : event.seatsAvailable <= 0 ? 'full' : 'open'
            return (
              <li key={event.id} className="card-surface" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <Link href={`/events/${event.id}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, textDecoration: 'none' }}>
                    {event.name}
                  </Link>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                    {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.venue} · {event.seatsAvailable}/{event.capacity} seats
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge status={status} />
                  <button className="btn btn-secondary" disabled={event.cancelled || isPending} onClick={() => openEditForm(event)}>Edit</button>
                  <button className="btn btn-secondary" disabled={event.cancelled || isPending} onClick={() => handleCancel(event.id)}>Cancel</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 14.5, background: 'var(--paper-raised)',
}
