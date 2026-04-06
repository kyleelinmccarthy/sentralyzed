'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Card } from '@/components/ui/card'
import { PollCard } from '@/components/polls/PollCard'
import { POLL_CONTEXT_TYPES } from '@sentralyzed/shared/types/poll'
import type { PollWithResults, PollContextType } from '@sentralyzed/shared/types/poll'

const contextLabels: Record<PollContextType, string> = {
  channel: 'Chat',
  forum: 'Forum',
  project: 'Project',
  goal: 'Goal',
  task: 'Task',
  client: 'Client',
  expense: 'Expense',
  calendar: 'Calendar',
  user: 'User',
  whiteboard: 'Whiteboard',
  feedback: 'Feedback',
  asset: 'Asset',
}

export default function PollsPage() {
  const { user } = useAuthStore()
  const [polls, setPolls] = useState<PollWithResults[]>([])
  const [filter, setFilter] = useState<PollContextType | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadPolls()
  }, [])

  const loadPolls = async () => {
    try {
      const data = await api.get<{ polls: PollWithResults[] }>('/polls')
      setPolls(data.polls)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoted = (updated: PollWithResults) => {
    setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handleClosed = (updated: PollWithResults) => {
    setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handleDeleted = (pollId: string) => {
    setPolls((prev) => prev.filter((p) => p.id !== pollId))
  }

  const filtered = filter === 'all' ? polls : polls.filter((p) => p.contextType === filter)

  if (isLoading) {
    return <div className="animate-pulse text-french-gray">Loading polls...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">Polls</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', ...POLL_CONTEXT_TYPES] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-indigo text-white'
                : 'bg-gray-100 dark:bg-dark-border text-jet dark:text-dark-text hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            {type === 'all' ? 'All' : contextLabels[type as PollContextType]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-french-gray text-center">
            No polls found. Polls can be created from Chat, Forums, Projects, Goals, Tasks, Clients,
            Expenses, Calendar, Users, Whiteboards, and Feedback.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((poll) => (
            <div key={poll.id}>
              <p className="text-xs text-french-gray mb-1">
                {contextLabels[poll.contextType]} &middot;{' '}
                {new Date(poll.createdAt).toLocaleDateString()}
              </p>
              <PollCard
                poll={poll}
                currentUserId={user?.id || ''}
                onVoted={handleVoted}
                onClosed={handleClosed}
                onDeleted={handleDeleted}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
