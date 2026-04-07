'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-3.5">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[11px] text-french-gray dark:text-dark-text-secondary mt-1 font-medium">
        {label}
      </p>
    </Card>
  )
}

interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  color: string
}

function MiniCalendar() {
  const [offset, setOffset] = useState(0)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const now = new Date()
  const viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const month = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const isCurrentMonth = offset === 0
  const today = isCurrentMonth ? now.getDate() : -1

  const firstDay = viewDate.getDay()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()

  useEffect(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
    api
      .get<{ events: CalendarEvent[] }>(
        `/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
      )
      .then((data) => setEvents(data.events))
      .catch(() => setEvents([]))
  }, [offset])

  const eventDays = new Set(events.map((e) => new Date(e.startTime).getDate()))

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-jet dark:text-dark-text">{month}</h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setOffset(offset - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-french-gray dark:text-dark-text-secondary transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setOffset(offset + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-french-gray dark:text-dark-text-secondary transition-colors"
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((d) => (
          <div key={d} className="text-french-gray dark:text-dark-text-secondary font-medium py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`relative py-1 rounded-md text-[12px]
              ${day === today ? 'bg-indigo text-white font-semibold' : 'text-jet dark:text-dark-text'}
              ${day && day !== today ? 'hover:bg-light-hover dark:hover:bg-dark-hover cursor-pointer' : ''}
            `}
          >
            {day || ''}
            {day && eventDays.has(day) && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo" />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function RightPanel() {
  return (
    <aside className="w-[320px] fixed right-0 top-0 h-screen overflow-y-auto p-5 bg-light-bg dark:bg-dark-bg border-l border-light-border dark:border-dark-border">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-french-gray dark:text-dark-text-secondary mb-4">
        Quick Stats
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Planned Today" value={0} color="#3B82F6" />
        <StatCard label="Finished Yesterday" value={0} color="#26A69A" />
        <StatCard label="Due This Week" value={0} color="#64748B" />
        <StatCard label="Overdue" value={0} color="#5C6BC0" />
      </div>

      <MiniCalendar />
    </aside>
  )
}
