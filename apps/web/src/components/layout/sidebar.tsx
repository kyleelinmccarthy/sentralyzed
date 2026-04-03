'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  CheckSquare,
  Users,
  Target,
  MessageCircle,
  MessagesSquare,
  BarChart3,
  PenTool,
  MessageSquarePlus,
  ShieldCheck,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const overviewNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
]

const workNavItems: NavItem[] = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/goals', label: 'Goals', icon: Target },
]

const collaborateNavItems: NavItem[] = [
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/forums', label: 'Forums', icon: MessagesSquare },
  { href: '/polls', label: 'Polls', icon: BarChart3 },
  { href: '/whiteboards', label: 'Whiteboards', icon: PenTool },
  { href: '/feedback', label: 'Feedback', icon: MessageSquarePlus },
]

const accountNavItems: NavItem[] = [
  { href: '/admin/users', label: 'Admin', icon: ShieldCheck },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <div className="mb-5">
      <h3 className="px-4 text-[11px] font-semibold uppercase tracking-widest text-french-gray dark:text-dark-text-secondary mb-2">
        {title}
      </h3>
      <nav className="space-y-0.5 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-lg transition-all duration-150
                ${
                  isActive
                    ? 'bg-indigo/10 text-indigo font-medium dark:bg-indigo/15'
                    : 'text-slate-gray dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-jet dark:hover:text-dark-text'
                }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
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
    <aside className="w-[220px] bg-light-surface dark:bg-dark-surface flex flex-col h-screen fixed left-0 top-0 border-r border-light-border dark:border-dark-border">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <h1
          className="text-lg font-bold tracking-tight text-jet dark:text-dark-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Sentralyzed
        </h1>
      </div>

      {/* User section */}
      <div className="px-4 pb-4 mb-1">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-light-muted dark:bg-dark-card">
          <div className="w-9 h-9 rounded-full bg-indigo/10 dark:bg-indigo/20 flex items-center justify-center text-sm font-semibold text-indigo">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
              {user?.name || 'User'}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              <span className="text-[11px] text-french-gray dark:text-dark-text-secondary">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-1">
        <NavSection title="Overview" items={overviewNavItems} />
        <NavSection title="Work" items={workNavItems} />
        <NavSection title="Collaborate" items={collaborateNavItems} />
        <NavSection title="Account" items={accountNavItems} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-light-border dark:border-dark-border flex items-center justify-between">
        <button
          onClick={() => void logout()}
          className="flex items-center gap-2 text-[13px] text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text transition-colors px-2 py-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Sign out
        </button>
        <ThemeToggle />
      </div>
    </aside>
  )
}
