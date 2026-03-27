'use client'

import { Input } from '@/components/ui/input'

export function TopBar() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 gap-4">
      <div className="flex-1 max-w-md">
        <Input placeholder="Search projects, tasks, messages..." className="bg-gray-50" />
      </div>
    </header>
  )
}
