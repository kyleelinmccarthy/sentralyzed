import { Sidebar } from '@/components/layout/sidebar'
import { RightPanel } from '@/components/layout/right-panel'
import { TopBar } from '@/components/layout/top-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar />
      <div className="ml-[220px] mr-[320px]">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
      <RightPanel />
    </div>
  )
}
