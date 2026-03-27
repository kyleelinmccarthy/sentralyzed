'use client'

import { Card } from '@/components/ui/card'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-3">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-french-gray mt-1">{label}</p>
    </Card>
  )
}

function MiniCalendar() {
  const now = new Date()
  const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const today = now.getDate()

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">{month}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((d) => (
          <div key={d} className="text-french-gray font-medium py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`py-1 rounded
              ${day === today ? 'bg-indigo text-white font-bold' : ''}
              ${day ? 'hover:bg-gray-100 cursor-pointer' : ''}
            `}
          >
            {day || ''}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function RightPanel() {
  return (
    <aside className="w-[320px] fixed right-0 top-0 h-screen overflow-y-auto p-4 bg-gray-50 border-l border-gray-200">
      <h2 className="text-sm font-semibold text-jet mb-4">Quick Stats</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Planned Today" value={0} color="#5C6BC0" />
        <StatCard label="Finished Yesterday" value={0} color="#26A69A" />
        <StatCard label="Due This Week" value={0} color="#FF7043" />
        <StatCard label="Overdue" value={0} color="#E53935" />
      </div>

      <MiniCalendar />
    </aside>
  )
}
