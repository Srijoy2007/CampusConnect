'use client'

import { useMemo, useState } from 'react'
import {
  events,
  EventCategory,
  isPastEvent,
  searchEventsByName,
  filterEventsByCategory,
} from '@/data/events'
import EventCard from '@/components/EventCard'
import EmptyState from '@/components/EmptyState'

const CATEGORIES: (EventCategory | 'All')[] = [
  'All',
  'Tech',
  'Cultural',
  'Sports',
  'Workshop',
  'Career',
  'Music',
]

export default function EventsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EventCategory | 'All'>('All')

  const results = useMemo(() => {
    const upcoming = events
      .filter((e) => !isPastEvent(e) && !e.cancelled)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const byName = searchEventsByName(upcoming, query)
    return filterEventsByCategory(byName, category)
  }, [query, category])

  const hasActiveFilters = query.trim() !== '' || category !== 'All'

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">the board</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>All events</h1>
        <p style={{ marginTop: 8 }}>
          Everything posted by clubs and departments this semester.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          type="search"
          placeholder="Search events by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper-raised)',
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory | 'All')}
          style={{
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper-raised)',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All categories' : c}
            </option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No events match that search"
          description={
            hasActiveFilters
              ? 'Try a different name or switch back to all categories.'
              : 'Check back soon — nothing upcoming has been posted yet.'
          }
          action={
            hasActiveFilters ? (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                }}
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {results.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
