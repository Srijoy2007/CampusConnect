'use client'

import { useState, useTransition } from 'react'
import { useAuth } from './AuthProvider'
import { registerForEvent } from '@/app/actions'

export default function RegisterPanel({
  eventId,
  past,
  full,
  cancelled,
  confirmedStudentIds,
}: {
  eventId: string
  past: boolean
  full: boolean
  cancelled: boolean
  confirmedStudentIds: string[]
}) {
  const { currentUser } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState <
    { type: 'success' | 'error'; text: string } | null
 >(null)

  const isStudent = currentUser.role === 'student'
  const alreadyRegistered =
    isStudent && confirmedStudentIds.includes(currentUser.id)
  const canRegister =
    isStudent && !past && !full && !cancelled && !alreadyRegistered

  function handleRegister() {
    setMessage(null)
    startTransition(async () => {
      const result = await registerForEvent(eventId, currentUser.id)
      if (result.ok) {
        setMessage({ type: 'success', text: "You're registered! Check My Registrations." })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  let label = 'Register'
  if (!isStudent) label = 'Log in as a student to register'
  else if (alreadyRegistered) label = 'Already registered'
  else if (cancelled || past) label = 'Registration closed'
  else if (full) label = 'Event full'
  else if (isPending) label = 'Registering…'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        className="btn btn-primary"
        disabled={!canRegister || isPending}
        style={{ marginTop: 4 }}
        onClick={handleRegister}
      >
        {label}
      </button>
      {message && (
        <p
          style={{
            fontSize: 13.5,
            color: message.type === 'error' ? 'var(--rust)' : 'var(--green)',
            margin: 0,
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
