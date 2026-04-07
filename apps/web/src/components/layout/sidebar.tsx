'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
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
  Receipt,
  Package,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
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
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/assets', label: 'Assets', icon: Package },
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

function NavSection({
  title,
  items,
  collapsed,
}: {
  title: string
  items: NavItem[]
  collapsed: boolean
}) {
  const pathname = usePathname()

  return (
    <div className="mb-5">
      {!collapsed && (
        <h3 className="px-4 text-[11px] font-semibold uppercase tracking-widest text-french-gray dark:text-dark-text-secondary mb-2">
          {title}
        </h3>
      )}
      <nav className={`space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2'} text-[13px] rounded-lg transition-all duration-150
                ${
                  isActive
                    ? 'bg-indigo/10 text-indigo font-medium dark:bg-indigo/15'
                    : 'text-slate-gray dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-jet dark:hover:text-dark-text'
                }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { collapsed, toggle } = useSidebarStore()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebar-collapsed')
      if (stored === 'true') {
        useSidebarStore.setState({ collapsed: true })
      }
    } catch {}
  }, [])

  return (
    <aside
      className={`${collapsed ? 'w-[64px]' : 'w-[220px]'} bg-light-surface dark:bg-dark-surface flex flex-col h-screen fixed left-0 top-0 border-r border-light-border dark:border-dark-border transition-all duration-200`}
    >
      {/* Brand */}
      <div className={`${collapsed ? 'px-2 pt-5 pb-4 flex justify-center' : 'px-5 pt-5 pb-4'}`}>
        <div className="flex items-center gap-2">
          <img
            src="/sentral_logo.png"
            alt="Sentral"
            className={collapsed ? 'h-8 w-auto' : 'h-9 w-auto'}
          />
          {!collapsed && (
            <h1
              className="text-lg font-bold tracking-tight text-jet dark:text-dark-text"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Sentral
            </h1>
          )}
        </div>
      </div>

      {/* User section */}
      {!collapsed && (
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
      )}

      {collapsed && (
        <div className="flex justify-center pb-4 mb-1">
          <div
            className="w-9 h-9 rounded-full bg-indigo/10 dark:bg-indigo/20 flex items-center justify-center text-sm font-semibold text-indigo"
            title={user?.name || 'User'}
          >
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-1">
        <NavSection title="Overview" items={overviewNavItems} collapsed={collapsed} />
        <NavSection title="Work" items={workNavItems} collapsed={collapsed} />
        <NavSection title="Collaborate" items={collaborateNavItems} collapsed={collapsed} />
        <NavSection title="Account" items={accountNavItems} collapsed={collapsed} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-light-border dark:border-dark-border">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => void logout()}
              title="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
            <ThemeToggle />
            <button
              onClick={toggle}
              title="Expand sidebar"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
            >
              <ChevronsRight size={15} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 text-[13px] text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text transition-colors px-2 py-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover"
            >
              <LogOut size={15} strokeWidth={1.5} />
              Sign out
            </button>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={toggle}
                title="Collapse sidebar"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
              >
                <ChevronsLeft size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
