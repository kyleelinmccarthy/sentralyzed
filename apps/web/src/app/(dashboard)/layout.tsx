'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { RightPanel } from '@/components/layout/right-panel'
import { TopBar } from '@/components/layout/top-bar'
import { useSidebarStore } from '@/stores/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed)

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <Sidebar />
      <div
        className="mr-[320px] transition-all duration-200"
        style={{ marginLeft: collapsed ? 64 : 220 }}
      >
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
      <RightPanel />
    </div>
  )
}
