'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'
import { FileAttachments } from '@/components/files/FileAttachments'
import type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackResponse,
} from '@sentral/shared/types/feedback'

interface FeedbackItem {
  id: string
  title: string
  description: string
  category: FeedbackCategory
  priority: FeedbackPriority
  status: FeedbackStatus
  submittedBy: string
  reviewedBy: string | null
  adminNotes: string | null
  createdAt: string
  responses?: FeedbackResponse[]
}

const statusColors: Record<FeedbackStatus, string> = {
  open: '#9CA3AF',
  in_review: '#5C6BC0',
  resolved: '#26A69A',
  closed: '#64748B',
}

const statusLabels: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
  closed: 'Closed',
}

const priorityColors: Record<FeedbackPriority, string> = {
  low: '#9CA3AF',
  medium: '#5C6BC0',
  high: '#FF7043',
  critical: '#FF7043',
}

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  improvement: 'Improvement',
  question: 'Question',
  other: 'Other',
}

const CATEGORIES: FeedbackCategory[] = [
  'bug',
  'feature_request',
  'improvement',
  'question',
  'other',
]
const PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']
const STATUSES: FeedbackStatus[] = ['open', 'in_review', 'resolved', 'closed']

function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
      style={{ backgroundColor: statusColors[status] }}
    >
      {statusLabels[status]}
    </span>
  )
}

function PriorityDot({ priority }: { priority: FeedbackPriority }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: priorityColors[priority] }}
      title={priority}
    />
  )
}

export default function FeedbackPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<FeedbackItem | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [priority, setPriority] = useState<FeedbackPriority>('medium')

  // Filter state
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | ''>('')

  // Response form state
  const [responseMessage, setResponseMessage] = useState('')

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState<FeedbackCategory>('bug')
  const [editPriority, setEditPriority] = useState<FeedbackPriority>('medium')

  useEffect(() => {
    void loadFeedback()
  }, [filterStatus])

  const loadFeedback = async () => {
    try {
      const query = filterStatus ? `?status=${filterStatus}` : ''
      const data = await api.get<{ feedback: FeedbackItem[] }>(`/feedback${query}`)
      setFeedbackList(data.feedback)
    } finally {
      setIsLoading(false)
    }
  }

  const createFeedback = async () => {
    if (!title.trim() || !description.trim()) return
    await api.post('/feedback', { title, description, category, priority })
    setTitle('')
    setDescription('')
    setCategory('bug')
    setPriority('medium')
    setShowForm(false)
    void loadFeedback()
  }

  const loadDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedItem(null)
      setIsEditing(false)
      return
    }
    const data = await api.get<{ feedback: FeedbackItem }>(`/feedback/${id}`)
    setExpandedItem(data.feedback)
    setExpandedId(id)
    setIsEditing(false)
  }

  const updateStatus = async (id: string, status: FeedbackStatus, adminNotes?: string) => {
    await api.patch(`/feedback/${id}/status`, { status, adminNotes: adminNotes || undefined })
    void loadFeedback()
    if (expandedId === id) void loadDetail(id).then(() => setExpandedId(id))
  }

  const addResponse = async (id: string) => {
    if (!responseMessage.trim()) return
    await api.post(`/feedback/${id}/responses`, { message: responseMessage })
    setResponseMessage('')
    // Reload detail
    const data = await api.get<{ feedback: FeedbackItem }>(`/feedback/${id}`)
    setExpandedItem(data.feedback)
  }

  const startEditing = (item: FeedbackItem) => {
    setEditTitle(item.title)
    setEditDescription(item.description)
    setEditCategory(item.category)
    setEditPriority(item.priority)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim() || !editDescription.trim()) return
    await api.patch(`/feedback/${id}`, {
      title: editTitle,
      description: editDescription,
      category: editCategory,
      priority: editPriority,
    })
    setIsEditing(false)
    void loadFeedback()
    const data = await api.get<{ feedback: FeedbackItem }>(`/feedback/${id}`)
    setExpandedItem(data.feedback)
  }

  const deleteFeedback = async (id: string) => {
    await api.delete(`/feedback/${id}`)
    setExpandedId(null)
    setExpandedItem(null)
    void loadFeedback()
  }

  if (isLoading) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">
        Loading feedback...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">Feedback</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FeedbackStatus | '')}
            className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Submit Feedback'}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            <Input
              placeholder="Feedback title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Describe your feedback in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo resize-none"
            />
            <div className="flex gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <Button onClick={() => void createFeedback()}>Submit</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {feedbackList.length === 0 ? (
          <p className="p-6 text-sm text-french-gray dark:text-dark-text-secondary text-center">
            No feedback yet. Submit your first feedback to get started.
          </p>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {feedbackList.map((item) => (
              <div key={item.id}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
                  onClick={() => void loadDetail(item.id)}
                >
                  <PriorityDot priority={item.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                      {categoryLabels[item.category]} ·{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {expandedId === item.id && expandedItem && (
                  <div className="px-4 pb-4 border-t border-light-border dark:border-dark-border bg-light-muted dark:bg-dark-bg">
                    <div className="pt-4 space-y-4">
                      {/* Edit Button */}
                      {expandedItem.submittedBy === user?.id && !isEditing && (
                        <div className="flex justify-end">
                          <Button variant="outline" onClick={() => startEditing(expandedItem)}>
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit Feedback
                          </Button>
                        </div>
                      )}

                      {/* Editable Fields */}
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-1">
                              Title
                            </h4>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-1">
                              Description
                            </h4>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo resize-none"
                            />
                          </div>
                          <div className="flex gap-3">
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-1">
                                Category
                              </h4>
                              <select
                                value={editCategory}
                                onChange={(e) =>
                                  setEditCategory(e.target.value as FeedbackCategory)
                                }
                                className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {categoryLabels[c]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-1">
                                Priority
                              </h4>
                              <select
                                value={editPriority}
                                onChange={(e) =>
                                  setEditPriority(e.target.value as FeedbackPriority)
                                }
                                className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
                              >
                                {PRIORITIES.map((p) => (
                                  <option key={p} value={p}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button onClick={() => void saveEdit(expandedItem.id)}>
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Description (read-only) */
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-1">
                            Description
                          </h4>
                          <p className="text-sm text-jet dark:text-dark-text whitespace-pre-wrap">
                            {expandedItem.description}
                          </p>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {expandedItem.adminNotes && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-1">
                            Admin Notes
                          </h4>
                          <p className="text-sm text-jet dark:text-dark-text">
                            {expandedItem.adminNotes}
                          </p>
                        </div>
                      )}

                      {/* Responses */}
                      {expandedItem.responses && expandedItem.responses.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary mb-2">
                            Responses
                          </h4>
                          <div className="space-y-2">
                            {expandedItem.responses.map((resp) => (
                              <div
                                key={resp.id}
                                className="p-3 rounded-lg bg-light-surface dark:bg-dark-card border border-light-border dark:border-dark-border"
                              >
                                <p className="text-sm text-jet dark:text-dark-text">
                                  {resp.message}
                                </p>
                                <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-1">
                                  {new Date(resp.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="space-y-3 pt-2 border-t border-light-border dark:border-dark-border">
                          <div className="flex items-center gap-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary">
                              Update Status
                            </label>
                            <select
                              value={expandedItem.status}
                              onChange={(e) =>
                                void updateStatus(expandedItem.id, e.target.value as FeedbackStatus)
                              }
                              className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {statusLabels[s]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a response..."
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void addResponse(expandedItem.id)
                              }}
                              className="flex-1 px-3 py-1.5 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
                            />
                            <Button size="sm" onClick={() => void addResponse(expandedItem.id)}>
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Attachments */}
                      <FileAttachments entityType="feedback" entityId={item.id} />

                      {/* Delete */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => void deleteFeedback(item.id)}
                          className="text-xs text-coral hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
