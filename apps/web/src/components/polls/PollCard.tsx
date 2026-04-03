'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PollWithResults } from '@sentralyzed/shared/types/poll'

interface PollCardProps {
  poll: PollWithResults
  currentUserId: string
  onVoted?: (poll: PollWithResults) => void
  onClosed?: (poll: PollWithResults) => void
  onDeleted?: (pollId: string) => void
}

export function PollCard({ poll, currentUserId, onVoted, onClosed, onDeleted }: PollCardProps) {
  const [selected, setSelected] = useState<string[]>(poll.userVotes)
  const [voting, setVoting] = useState(false)

  const hasVoted = poll.userVotes.length > 0
  const isClosed = !!poll.closedAt
  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false
  const isOwner = poll.createdBy === currentUserId
  const showResults = hasVoted || isClosed || isExpired

  const toggleOption = (optionId: string) => {
    if (showResults) return
    if (poll.allowMultiple) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    } else {
      setSelected([optionId])
    }
  }

  const submitVote = async () => {
    if (selected.length === 0) return
    setVoting(true)
    try {
      const data = await api.post<{ poll: PollWithResults }>(`/polls/${poll.id}/vote`, {
        optionIds: selected,
      })
      onVoted?.(data.poll)
    } finally {
      setVoting(false)
    }
  }

  const closePoll = async () => {
    const data = await api.post<{ poll: PollWithResults }>(`/polls/${poll.id}/close`)
    onClosed?.(data.poll)
  }

  const deletePoll = async () => {
    await api.delete(`/polls/${poll.id}`)
    onDeleted?.(poll.id)
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm text-jet dark:text-dark-text">{poll.question}</h4>
          <p className="text-xs text-french-gray mt-0.5">
            {poll.allowMultiple ? 'Select multiple' : 'Select one'}
            {poll.totalVotes > 0 && ` · ${poll.totalVotes} vote${poll.totalVotes !== 1 ? 's' : ''}`}
            {isClosed && ' · Closed'}
            {isExpired && !isClosed && ' · Expired'}
          </p>
        </div>
        {isOwner && !isClosed && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => void closePoll()}>
              Close
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void deletePoll()}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage =
            poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0
          const isSelected = selected.includes(option.id)
          const isUserVote = poll.userVotes.includes(option.id)

          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={showResults}
              className={`w-full text-left rounded-[8px] border transition-colors relative overflow-hidden ${
                isSelected && !showResults
                  ? 'border-indigo bg-indigo/5'
                  : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
              } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {showResults && (
                <div
                  className="absolute inset-0 bg-indigo/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-jet dark:text-dark-text">
                  {!showResults && (
                    <span
                      className={`inline-block w-4 h-4 mr-2 rounded-${poll.allowMultiple ? 'sm' : 'full'} border align-middle ${
                        isSelected ? 'border-indigo bg-indigo' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </span>
                  )}
                  {option.text}
                  {isUserVote && showResults && (
                    <span className="ml-1 text-xs text-indigo">(your vote)</span>
                  )}
                </span>
                {showResults && (
                  <span className="text-xs font-medium text-french-gray ml-2 shrink-0">
                    {option.voteCount} ({percentage}%)
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!showResults && selected.length > 0 && (
        <Button size="sm" className="mt-3" onClick={() => void submitVote()} isLoading={voting}>
          Vote
        </Button>
      )}
    </Card>
  )
}
