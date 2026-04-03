'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PollsSection } from '@/components/polls/PollsSection'

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
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

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
    setNewCategoryColor('#6366f1')
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
    const data = await api.get<{ replies: Reply[] }>(`/forums/threads/${thread.id}/replies`)
    setReplies(data.replies)
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
          <h1 className="text-xl font-bold text-jet">{activeThread.title}</h1>
          <p className="text-sm text-french-gray mt-1">
            {activeThread.viewCount} views &middot;{' '}
            {new Date(activeThread.createdAt).toLocaleDateString()}
          </p>
          {activeThread.content ? (
            <div className="mt-4 text-sm text-jet">{String(activeThread.content)}</div>
          ) : null}
        </Card>

        <h3 className="text-sm font-semibold text-jet mb-3">Replies ({replies.length})</h3>
        <div className="space-y-3 mb-4">
          {replies.map((reply) => (
            <Card key={reply.id} className="p-4">
              <p className="text-sm text-jet">{String(reply.content)}</p>
              <p className="text-xs text-french-gray mt-2">
                {new Date(reply.createdAt).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-4">
          <PollsSection contextType="forum" contextId={activeThread.id} />
        </Card>

        {!activeThread.isLocked && (
          <Card className="p-4">
            <textarea
              className="w-full border border-french-gray rounded-[8px] p-3 text-sm resize-none"
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
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'text-white' : 'text-jet hover:opacity-80'}`}
            style={{ backgroundColor: activeCategory === cat.id ? cat.color : '#f3f4f6' }}
          >
            {cat.name}
          </button>
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
              className="w-full border border-french-gray rounded-[8px] p-2 text-sm mb-2 bg-white"
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
            className="w-full border border-french-gray rounded-[8px] p-3 text-sm resize-none mb-2"
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
              className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
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
