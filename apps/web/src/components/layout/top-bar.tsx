'use client'

import { Search } from 'lucide-react'

export function TopBar() {
  return (
    <header className="h-14 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center px-6 gap-4">
      <div className="flex-1 max-w-md relative">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-french-gray dark:text-dark-text-secondary"
        />
        <input
          placeholder="Search projects, tasks, messages..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-muted dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
        />
      </div>
    </header>
  )
}
