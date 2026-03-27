'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'

interface Activity {
  id: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  metadata: unknown
  createdAt: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const data = await api.get<{ activities: Activity[] }>('/activities')
      setActivities(data.activities)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="animate-pulse text-french-gray">Loading activity...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet mb-6">Activity Feed</h1>
      <Card>
        {activities.length === 0 ? (
          <p className="p-6 text-sm text-french-gray text-center">No activity yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
              <p className="text-sm text-jet">
                <span className="font-medium">{activity.action}</span>{' '}
                <span className="text-french-gray">{activity.entityType}</span>
              </p>
              <p className="text-xs text-french-gray mt-1">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
