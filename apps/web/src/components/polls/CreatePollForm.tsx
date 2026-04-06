'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { PollContextType, PollWithResults } from '@sentral/shared/types/poll'

interface CreatePollFormProps {
  contextType: PollContextType
  contextId: string
  onCreated: (poll: PollWithResults) => void
  onCancel: () => void
}

export function CreatePollForm({
  contextType,
  contextId,
  onCreated,
  onCancel,
}: CreatePollFormProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((opt, i) => (i === index ? value : opt)))
  }

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const data = await api.post<{ poll: PollWithResults }>('/polls', {
        question,
        contextType,
        contextId,
        options: options.filter((o) => o.trim()),
        allowMultiple,
        isAnonymous,
      })
      onCreated(data.poll)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-jet dark:text-dark-text mb-3">Create a Poll</h4>

      <Input
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="mb-3"
      />

      <div className="space-y-2 mb-3">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1"
            />
            {options.length > 2 && (
              <Button size="sm" variant="ghost" onClick={() => removeOption(i)}>
                X
              </Button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <Button size="sm" variant="outline" onClick={addOption}>
            + Add Option
          </Button>
        )}
      </div>

      <div className="flex gap-4 mb-3 text-sm">
        <label className="flex items-center gap-1.5 text-jet dark:text-dark-text cursor-pointer">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
            className="rounded border-gray-300"
          />
          Allow multiple choices
        </label>
        <label className="flex items-center gap-1.5 text-jet dark:text-dark-text cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300"
          />
          Anonymous voting
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => void submit()}
          isLoading={submitting}
          disabled={!canSubmit}
        >
          Create Poll
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
