'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

const projectsNavItems = [
  { href: '/', label: 'Dashboard', icon: '◻' },
  { href: '/tasks', label: 'Tasks', icon: '☑' },
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/goals', label: 'Goals', icon: '◎' },
]

const communicationNavItems = [
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/forums', label: 'Forums', icon: '📋' },
  { href: '/whiteboards', label: 'Whiteboards', icon: '🖊' },
]

const settingsNavItems = [
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/profile', label: 'Profile', icon: '👤' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

function NavSection({ title, items }: { title: string; items: typeof projectsNavItems }) {
  const pathname = usePathname()

  return (
    <div className="mb-6">
      <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-french-gray mb-2">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg mx-2 transition-colors
                ${isActive ? 'bg-indigo/10 text-indigo font-medium' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-[220px] bg-jet text-white flex flex-col h-screen fixed left-0 top-0">
      {/* User section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal" />
              <span className="text-xs text-french-gray">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavSection title="Projects & Tasks" items={projectsNavItems} />
        <NavSection title="Communication" items={communicationNavItems} />
        <NavSection title="Profile & Settings" items={settingsNavItems} />
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => void logout()}
          className="w-full text-left text-sm text-french-gray hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
