'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  allDay: boolean
  color: string
  location: string | null
}

interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface Attendee {
  userId: string
  requirement: 'required' | 'optional'
  status: string
  name: string
  email: string
  avatarUrl: string | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [showEventForm, setShowEventForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editColor, setEditColor] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [newAttendees, setNewAttendees] = useState<
    Array<{ userId: string; requirement: 'required' | 'optional' }>
  >([])
  const [editAttendees, setEditAttendees] = useState<
    Array<{ userId: string; requirement: 'required' | 'optional' }>
  >([])

  useEffect(() => {
    void loadEvents()
  }, [currentDate])

  useEffect(() => {
    void loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.get<{ users: User[] }>('/chat/users')
      setAllUsers(data.users)
    } catch {
      // API may not be connected yet
    }
  }

  const loadEvents = async () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    try {
      const data = await api.get<{ events: CalendarEvent[] }>(
        `/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
      )
      setEvents(data.events)
    } catch {
      // API may not be connected yet
    }
  }

  const createEvent = async () => {
    if (!newTitle || !newStart || !newEnd) return
    await api.post('/calendar/events', {
      title: newTitle,
      startTime: newStart,
      endTime: newEnd,
      attendees: newAttendees.length ? newAttendees : undefined,
    })
    setNewTitle('')
    setNewStart('')
    setNewEnd('')
    setNewAttendees([])
    setShowEventForm(false)
    void loadEvents()
  }

  const openEditPanel = async (event: CalendarEvent) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditDescription(event.description || '')
    setEditStart(event.startTime.slice(0, 16)) // format for datetime-local
    setEditEnd(event.endTime.slice(0, 16))
    setEditLocation(event.location || '')
    setEditColor(event.color || '#5C6BC0')
    try {
      const data = await api.get<{ attendees: Attendee[] }>(
        `/calendar/events/${event.id}/attendees`,
      )
      setEditAttendees(
        data.attendees.map((a) => ({ userId: a.userId, requirement: a.requirement })),
      )
    } catch {
      setEditAttendees([])
    }
  }

  const saveEvent = async () => {
    if (!editingEvent) return
    await api.patch(`/calendar/events/${editingEvent.id}`, {
      title: editTitle,
      description: editDescription || null,
      startTime: editStart,
      endTime: editEnd,
      location: editLocation || null,
      color: editColor,
      attendees: editAttendees,
    })
    setEditingEvent(null)
    void loadEvents()
  }

  const deleteEvent = async () => {
    if (!editingEvent) return
    await api.delete(`/calendar/events/${editingEvent.id}`)
    setEditingEvent(null)
    void loadEvents()
  }

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const addAttendee = (
    userId: string,
    requirement: 'required' | 'optional',
    setter: typeof setNewAttendees,
  ) => {
    setter((prev) => {
      if (prev.some((a) => a.userId === userId)) return prev
      return [...prev, { userId, requirement }]
    })
  }

  const removeAttendee = (userId: string, setter: typeof setNewAttendees) => {
    setter((prev) => prev.filter((a) => a.userId !== userId))
  }

  const toggleRequirement = (userId: string, setter: typeof setNewAttendees) => {
    setter((prev) =>
      prev.map((a) =>
        a.userId === userId
          ? { ...a, requirement: a.requirement === 'required' ? 'optional' : 'required' }
          : a,
      ),
    )
  }

  const renderAttendeePicker = (
    attendees: Array<{ userId: string; requirement: 'required' | 'optional' }>,
    setter: typeof setNewAttendees,
  ) => {
    const available = allUsers.filter((u) => !attendees.some((a) => a.userId === u.id))
    return (
      <div className="col-span-full">
        <label className="block text-xs font-medium text-french-gray mb-1">Attendees</label>
        {attendees.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attendees.map((a) => {
              const user = allUsers.find((u) => u.id === a.userId)
              return (
                <div
                  key={a.userId}
                  className="flex items-center gap-1.5 bg-dark-bg border border-gray-700 rounded-full pl-3 pr-1 py-1 text-sm"
                >
                  <span className="text-jet">{user?.name || 'Unknown'}</span>
                  <button
                    type="button"
                    onClick={() => toggleRequirement(a.userId, setter)}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      a.requirement === 'required'
                        ? 'bg-indigo text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {a.requirement}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAttendee(a.userId, setter)}
                    className="text-french-gray hover:text-red-400 px-1"
                  >
                    &times;
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {available.length > 0 && (
          <select
            className="w-full bg-dark-bg border border-gray-700 rounded px-3 py-2 text-sm text-jet"
            value=""
            onChange={(e) => {
              if (e.target.value) addAttendee(e.target.value, 'required', setter)
            }}
          >
            <option value="">Add attendee...</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.startTime)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet">Calendar</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button onClick={() => setShowEventForm(!showEventForm)}>
            {showEventForm ? 'Cancel' : 'New Event'}
          </Button>
        </div>
      </div>

      {showEventForm && (
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Event title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              label="Title"
            />
            <Input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              label="Start"
            />
            <Input
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              label="End"
            />

            {renderAttendeePicker(newAttendees, setNewAttendees)}
          </div>
          <Button size="sm" className="mt-3" onClick={() => void createEvent()}>
            Create Event
          </Button>
        </Card>
      )}

      <Card className="p-4">
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-indigo hover:underline text-sm">
            &larr; Prev
          </button>
          <h2 className="text-lg font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="text-indigo hover:underline text-sm">
            Next &rarr;
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-french-gray py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {cells.map((day, i) => {
            const isToday =
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const dayEvents = day ? getEventsForDay(day) : []
            return (
              <div key={i} className={`bg-white min-h-[80px] p-1 ${!day ? 'bg-gray-50' : ''}`}>
                {day && (
                  <>
                    <span
                      className={`inline-block w-6 h-6 text-center text-xs leading-6 rounded-full ${isToday ? 'bg-indigo text-white font-bold' : 'text-jet'}`}
                    >
                      {day}
                    </span>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="text-xs truncate rounded px-1 py-0.5 mt-0.5 text-white cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: ev.color || '#5C6BC0' }}
                        onClick={() => openEditPanel(ev)}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Upcoming events */}
      <Card className="p-4 mt-4">
        <h3 className="text-sm font-semibold text-jet mb-3">Upcoming Events</h3>
        {events.length === 0 ? (
          <p className="text-sm text-french-gray">No events this month.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2"
                onClick={() => openEditPanel(ev)}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: ev.color || '#5C6BC0' }}
                />
                <div>
                  <p className="text-sm font-medium text-jet">{ev.title}</p>
                  <p className="text-xs text-french-gray">
                    {new Date(ev.startTime).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Event edit panel */}
      {editingEvent && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-jet">Edit Event</h3>
            <button
              onClick={() => setEditingEvent(null)}
              className="text-french-gray hover:text-jet text-sm"
            >
              &times; Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Input
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <Input
              label="Start"
              type="datetime-local"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
            />
            <Input
              label="End"
              type="datetime-local"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
            />
            <Input
              label="Location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
            <Input
              label="Color"
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
            />
            {renderAttendeePicker(editAttendees, setEditAttendees)}
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={() => void saveEvent()}>Save Changes</Button>
            <Button variant="danger" onClick={() => void deleteEvent()}>
              Delete Event
            </Button>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
