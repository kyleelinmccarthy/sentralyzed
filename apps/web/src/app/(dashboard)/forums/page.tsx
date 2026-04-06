'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PollsSection } from '@/components/polls/PollsSection'
import { FileAttachments } from '@/components/files/FileAttachments'

interface Category {
  id: string
  name: string
  description: string | null
  color: string
}
interface Thread {
  id: string
  title: string
  content: unknown
  categoryId: string
  authorId: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  createdAt: string
}
interface PinRecord {
  id: string
  entityType: string
  entityId: string
  pinnedBy: string
  createdAt: string
}

interface Reply {
  id: string
  threadId: string
  authorId: string
  content: unknown
  replyToId: string | null
  createdAt: string
}

export default function ForumsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [search, setSearch] = useState('')
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newThreadCategory, setNewThreadCategory] = useState<string>('')
  const [replyContent, setReplyContent] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#5C6BC0')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  // Edit state — threads
  const [editingThread, setEditingThread] = useState(false)
  const [editThreadTitle, setEditThreadTitle] = useState('')
  const [editThreadContent, setEditThreadContent] = useState('')

  // Edit state — replies
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editReplyContent, setEditReplyContent] = useState('')

  // Pin state — replies
  const [pinnedReplyIds, setPinnedReplyIds] = useState<Set<string>>(new Set())

  // Pinned panel toggle
  const [showPinnedPanel, setShowPinnedPanel] = useState(false)
  const replyRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Edit state — categories
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryColor, setEditCategoryColor] = useState('')
  const [editCategoryDesc, setEditCategoryDesc] = useState('')

  useEffect(() => {
    void loadCategories()
    void loadUserRole()
  }, [])
  useEffect(() => {
    void loadThreads()
  }, [activeCategory, search])

  const loadUserRole = () => {
    const user = useAuthStore.getState().user
    if (user) setUserRole(user.role)
  }

  const loadCategories = async () => {
    const data = await api.get<{ categories: Category[] }>('/forums/categories')
    setCategories(data.categories)
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) return
    await api.post('/forums/categories', {
      name: newCategoryName,
      description: newCategoryDesc || undefined,
      color: newCategoryColor,
    })
    setNewCategoryName('')
    setNewCategoryDesc('')
    setNewCategoryColor('#5C6BC0')
    setShowNewCategory(false)
    void loadCategories()
  }

  const loadThreads = async () => {
    const params = new URLSearchParams()
    if (activeCategory) params.set('categoryId', activeCategory)
    if (search) params.set('search', search)
    const data = await api.get<{ threads: Thread[] }>(`/forums/threads?${params}`)
    setThreads(data.threads)
  }

  const openThread = async (thread: Thread) => {
    setActiveThread(thread)
    const [repliesData, pinsData] = await Promise.all([
      api.get<{ replies: Reply[] }>(`/forums/threads/${thread.id}/replies`),
      api.get<{ pins: PinRecord[] }>(`/pins/threads/${thread.id}`),
    ])
    setReplies(repliesData.replies)
    setPinnedReplyIds(new Set(pinsData.pins.map((p) => p.entityId)))
  }

  const toggleReplyPin = async (replyId: string) => {
    if (pinnedReplyIds.has(replyId)) {
      await api.delete(`/pins/forum-replies/${replyId}`)
      setPinnedReplyIds((prev) => {
        const next = new Set(prev)
        next.delete(replyId)
        return next
      })
    } else {
      await api.post(`/pins/forum-replies/${replyId}`)
      setPinnedReplyIds((prev) => new Set(prev).add(replyId))
    }
  }

  const createThread = async () => {
    const categoryId = activeCategory || newThreadCategory
    if (!newTitle.trim() || !categoryId) return
    await api.post('/forums/threads', { title: newTitle, content: newContent, categoryId })
    setNewTitle('')
    setNewContent('')
    setNewThreadCategory('')
    setShowNewThread(false)
    void loadThreads()
  }

  const postReply = async () => {
    if (!replyContent.trim() || !activeThread) return
    await api.post(`/forums/threads/${activeThread.id}/replies`, { content: replyContent })
    setReplyContent('')
    void openThread(activeThread)
  }

  const startEditThread = () => {
    if (!activeThread) return
    setEditThreadTitle(activeThread.title)
    setEditThreadContent(activeThread.content ? String(activeThread.content) : '')
    setEditingThread(true)
  }

  const saveEditThread = async () => {
    if (!activeThread || !editThreadTitle.trim()) return
    await api.patch(`/forums/threads/${activeThread.id}`, {
      title: editThreadTitle,
      content: editThreadContent,
    })
    setEditingThread(false)
    const updated = { ...activeThread, title: editThreadTitle, content: editThreadContent }
    setActiveThread(updated)
    void loadThreads()
  }

  const startEditReply = (reply: Reply) => {
    setEditingReplyId(reply.id)
    setEditReplyContent(reply.content ? String(reply.content) : '')
  }

  const saveEditReply = async () => {
    if (!editingReplyId || !editReplyContent.trim() || !activeThread) return
    await api.patch(`/forums/replies/${editingReplyId}`, { content: editReplyContent })
    setEditingReplyId(null)
    setEditReplyContent('')
    void openThread(activeThread)
  }

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id)
    setEditCategoryName(cat.name)
    setEditCategoryColor(cat.color)
    setEditCategoryDesc(cat.description || '')
  }

  const saveEditCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return
    await api.patch(`/forums/categories/${editingCategoryId}`, {
      name: editCategoryName,
      color: editCategoryColor,
      description: editCategoryDesc || undefined,
    })
    setEditingCategoryId(null)
    void loadCategories()
  }

  const scrollToReply = (replyId: string) => {
    const el = replyRefs.current.get(replyId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-indigo', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo', 'ring-offset-2'), 2000)
    }
  }

  const pinnedReplies = replies.filter((r) => pinnedReplyIds.has(r.id))

  if (activeThread) {
    return (
      <div>
        <button
          onClick={() => setActiveThread(null)}
          className="text-sm text-indigo mb-4 hover:underline"
        >
          &larr; Back to threads
        </button>
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {activeThread.isPinned && (
              <span className="text-xs bg-indigo/10 text-indigo px-2 py-0.5 rounded-full">
                Pinned
              </span>
            )}
            {activeThread.isLocked && (
              <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full">
                Locked
              </span>
            )}
          </div>
          {editingThread ? (
            <div className="space-y-2">
              <Input
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
                placeholder="Thread title"
              />
              <textarea
                className="w-full border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary rounded-[8px] p-3 text-sm resize-none"
                rows={4}
                value={editThreadContent}
                onChange={(e) => setEditThreadContent(e.target.value)}
                placeholder="Thread content..."
              />
              <div className="flex gap-2 pt-1">
                <Button onClick={() => void saveEditThread()}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingThread(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-jet">{activeThread.title}</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showPinnedPanel ? 'text-white bg-indigo' : 'text-indigo bg-indigo/10 hover:bg-indigo/20'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                    {pinnedReplies.length > 0 ? `${pinnedReplies.length} Pinned` : 'Pinned'}
                  </button>
                  <Button variant="outline" onClick={startEditThread}>
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
                    Edit Thread
                  </Button>
                </div>
              </div>
              <p className="text-sm text-french-gray mt-1">
                {activeThread.viewCount} views &middot;{' '}
                {new Date(activeThread.createdAt).toLocaleDateString()}
              </p>
              {activeThread.content ? (
                <div className="mt-4 text-sm text-jet">{String(activeThread.content)}</div>
              ) : null}
            </>
          )}
        </Card>

        {showPinnedPanel && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-indigo"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <h3 className="text-sm font-semibold text-jet">Pinned Replies</h3>
              </div>
              <button
                onClick={() => setShowPinnedPanel(false)}
                className="p-1 rounded-md text-french-gray hover:text-jet hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {pinnedReplies.length === 0 ? (
              <p className="text-xs text-french-gray text-center py-4">
                No pinned replies in this thread yet.
              </p>
            ) : (
              <div className="space-y-2">
                {pinnedReplies.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => scrollToReply(r.id)}
                    className="flex items-center justify-between bg-indigo/5 rounded-lg p-3 cursor-pointer hover:bg-indigo/10 transition-colors group/pin"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-jet truncate">{String(r.content)}</p>
                      <p className="text-[11px] text-french-gray mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(r.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-indigo opacity-0 group-hover/pin:opacity-100 transition-opacity">
                        Jump
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void toggleReplyPin(r.id)
                        }}
                        className="text-[11px] text-coral opacity-0 group-hover/pin:opacity-100 transition-opacity hover:text-coral/80"
                      >
                        Unpin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <h3 className="text-sm font-semibold text-jet mb-3">Replies ({replies.length})</h3>
        <div className="space-y-3 mb-4">
          {replies.map((reply) => (
            <Card
              key={reply.id}
              ref={(el: HTMLDivElement | null) => {
                if (el) replyRefs.current.set(reply.id, el)
                else replyRefs.current.delete(reply.id)
              }}
              className={`p-4 transition-all duration-300 rounded-lg ${pinnedReplyIds.has(reply.id) ? 'border-l-3 border-l-indigo' : ''}`}
            >
              {pinnedReplyIds.has(reply.id) && (
                <span className="text-xs text-indigo font-medium mb-1 block">
                  <svg
                    className="w-3 h-3 inline mr-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  Pinned
                </span>
              )}
              {editingReplyId === reply.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary rounded-[8px] p-3 text-sm resize-none"
                    rows={3}
                    value={editReplyContent}
                    onChange={(e) => setEditReplyContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveEditReply()}>
                      Save Reply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingReplyId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-jet">{String(reply.content)}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => void toggleReplyPin(reply.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${pinnedReplyIds.has(reply.id) ? 'text-coral bg-coral/10 hover:bg-coral/20' : 'text-indigo bg-indigo/10 hover:bg-indigo/20'}`}
                        title={pinnedReplyIds.has(reply.id) ? 'Unpin reply' : 'Pin reply'}
                      >
                        <svg
                          className="w-3.5 h-3.5 inline mr-1"
                          fill={pinnedReplyIds.has(reply.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                        {pinnedReplyIds.has(reply.id) ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => startEditReply(reply)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-indigo bg-indigo/10 hover:bg-indigo/20 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5 inline mr-1"
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
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-french-gray mt-2">
                    {new Date(reply.createdAt).toLocaleString()}
                  </p>
                </>
              )}
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-4">
          <FileAttachments entityType="forum_post" entityId={activeThread.id} />
        </Card>

        <Card className="p-4 mb-4">
          <PollsSection contextType="forum" contextId={activeThread.id} />
        </Card>

        {!activeThread.isLocked && (
          <Card className="p-4">
            <textarea
              className="w-full border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary rounded-[8px] p-3 text-sm resize-none"
              rows={3}
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <Button size="sm" className="mt-2" onClick={() => void postReply()}>
              Post Reply
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet">Forums</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          {userRole === 'admin' && (
            <Button variant="outline" onClick={() => setShowNewCategory(!showNewCategory)}>
              {showNewCategory ? 'Cancel' : 'New Category'}
            </Button>
          )}
          {categories.length > 0 && (
            <Button onClick={() => setShowNewThread(!showNewThread)}>
              {showNewThread ? 'Cancel' : 'New Thread'}
            </Button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-indigo text-white' : 'bg-gray-100 text-jet hover:bg-gray-200'}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-1">
            {editingCategoryId === cat.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-32 h-8 text-sm"
                  placeholder="Name"
                />
                <input
                  type="color"
                  value={editCategoryColor}
                  onChange={(e) => setEditCategoryColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                />
                <Input
                  value={editCategoryDesc}
                  onChange={(e) => setEditCategoryDesc(e.target.value)}
                  className="w-40 h-8 text-sm"
                  placeholder="Description"
                />
                <Button size="sm" onClick={() => void saveEditCategory()}>
                  Save Category
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingCategoryId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'text-white' : 'bg-gray-100 text-jet hover:opacity-80'}`}
                  style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.name}
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={() => startEditCategory(cat)}
                    className="p-1 rounded-md text-indigo bg-indigo/10 hover:bg-indigo/20 transition-colors"
                    title="Edit category"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {showNewCategory && userRole === 'admin' && (
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold text-jet mb-2">Create Category</h3>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-200"
            />
          </div>
          <Input
            placeholder="Description (optional)"
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
            className="mb-2"
          />
          <Button size="sm" onClick={() => void createCategory()}>
            Create Category
          </Button>
        </Card>
      )}

      {showNewThread && (
        <Card className="p-4 mb-4">
          {!activeCategory && (
            <select
              value={newThreadCategory}
              onChange={(e) => setNewThreadCategory(e.target.value)}
              className="w-full border border-light-border dark:border-dark-border rounded-[8px] p-2 text-sm mb-2 bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          <Input
            placeholder="Thread title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="mb-2"
          />
          <textarea
            className="w-full border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary rounded-[8px] p-3 text-sm resize-none mb-2"
            rows={4}
            placeholder="Thread content..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <Button size="sm" onClick={() => void createThread()}>
            Create Thread
          </Button>
        </Card>
      )}

      {/* Thread list */}
      <Card>
        {threads.length === 0 ? (
          <p className="p-6 text-sm text-french-gray text-center">No threads yet.</p>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => void openThread(thread)}
              className="w-full text-left px-4 py-3 border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                {thread.isPinned && <span className="text-xs text-indigo">&#128204;</span>}
                <h3 className="text-sm font-medium text-jet">{thread.title}</h3>
              </div>
              <p className="text-xs text-french-gray mt-1">
                {thread.viewCount} views &middot; {new Date(thread.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))
        )}
      </Card>
    </div>
  )
}
