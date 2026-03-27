'use client'

import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet mb-6">Profile</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <p className="text-sm text-french-gray">{user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo/10 text-indigo mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
