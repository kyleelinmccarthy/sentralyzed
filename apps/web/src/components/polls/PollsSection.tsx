'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { CreatePollForm } from './CreatePollForm'
import { PollCard } from './PollCard'
import type { PollContextType, PollWithResults } from '@sentralyzed/shared/types/poll'

interface PollsSectionProps {
  contextType: PollContextType
  contextId: string
}

export function PollsSection({ contextType, contextId }: PollsSectionProps) {
  const { user } = useAuthStore()
  const [polls, setPolls] = useState<PollWithResults[]>([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    void loadPolls()
  }, [contextType, contextId])

  const loadPolls = async () => {
    const data = await api.get<{ polls: PollWithResults[] }>(
      `/polls?contextType=${contextType}&contextId=${contextId}`,
    )
    setPolls(data.polls)
  }

  const handleCreated = (poll: PollWithResults) => {
    setPolls((prev) => [poll, ...prev])
    setShowCreate(false)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-jet dark:text-dark-text">Polls</h3>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create Poll'}
        </Button>
      </div>

      {showCreate && (
        <div className="mb-3">
          <CreatePollForm
            contextType={contextType}
            contextId={contextId}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {polls.length === 0 && !showCreate ? (
        <p className="text-xs text-french-gray">No polls yet.</p>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={user?.id || ''}
              onVoted={handleVoted}
              onClosed={handleClosed}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
