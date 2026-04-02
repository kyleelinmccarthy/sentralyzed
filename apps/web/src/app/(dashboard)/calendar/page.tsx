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

  useEffect(() => {
    void loadEvents()
  }, [currentDate])

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
    await api.post('/calendar/events', { title: newTitle, startTime: newStart, endTime: newEnd })
    setNewTitle('')
    setNewStart('')
    setNewEnd('')
    setShowEventForm(false)
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
                        className="text-xs truncate rounded px-1 py-0.5 mt-0.5 text-white"
                        style={{ backgroundColor: ev.color || '#5C6BC0' }}
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
              <div key={ev.id} className="flex items-center gap-3 py-2">
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
    </div>
  )
}
