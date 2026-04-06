'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FileAttachments } from '@/components/files/FileAttachments'
import type { WsMessage } from '@sentral/shared/types/websocket'

interface ChatUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface Channel {
  id: string
  name: string
  type: string
  unreadCount: number
}

interface PinRecord {
  id: string
  entityType: string
  entityId: string
  pinnedBy: string
  createdAt: string
}

interface Message {
  id: string
  channelId: string
  authorId: string
  authorName?: string
  content: string
  replyToId: string | null
  createdAt: string
  editedAt: string | null
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const { send, on, isConnected } = useWebSocket()
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [showNewDM, setShowNewDM] = useState(false)
  const [dmUsers, setDmUsers] = useState<ChatUser[]>([])
  const [dmSearch, setDmSearch] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageContent, setEditingMessageContent] = useState('')
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [editingChannelName, setEditingChannelName] = useState('')
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [showPinnedPanel, setShowPinnedPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    void loadChannels()
  }, [])

  useEffect(() => {
    if (!activeChannel) return
    void loadMessages(activeChannel)
    void loadPins(activeChannel)
    void api.post(`/chat/channels/${activeChannel}/read`)
  }, [activeChannel])

  useEffect(() => {
    const unsub = on('chat:message', (msg: WsMessage) => {
      const payload = msg.payload as {
        channelId: string
        messageId: string
        authorId: string
        authorName: string
        content: string
        createdAt: string
      }
      if (payload.channelId === activeChannel) {
        setMessages((prev) => [
          ...prev,
          {
            id: payload.messageId,
            channelId: payload.channelId,
            authorId: payload.authorId,
            authorName: payload.authorName,
            content: payload.content,
            replyToId: null,
            createdAt: payload.createdAt,
            editedAt: null,
          },
        ])
      }
    })

    const unsubTyping = on('chat:typing', (msg: WsMessage) => {
      const payload = msg.payload as { channelId: string; userName: string }
      if (payload.channelId === activeChannel) {
        setTypingUsers((prev) => [...new Set([...prev, payload.userName])])
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingUsers([]), 3000)
      }
    })

    const unsubAck = on('chat:message:ack', (msg: WsMessage) => {
      const payload = msg.payload as { tempId: string; messageId: string }
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.tempId ? { ...m, id: payload.messageId } : m)),
      )
    })

    return () => {
      unsub()
      unsubTyping()
      unsubAck()
    }
  }, [on, activeChannel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChannels = async () => {
    const data = await api.get<{ channels: Channel[] }>('/chat/channels')
    setChannels(data.channels)
    if (data.channels.length > 0 && !activeChannel) {
      setActiveChannel(data.channels[0]!.id)
    }
  }

  const loadMessages = async (channelId: string) => {
    const data = await api.get<{ messages: Message[] }>(`/chat/channels/${channelId}/messages`)
    setMessages(data.messages.reverse())
  }

  const loadPins = async (channelId: string) => {
    const data = await api.get<{ pins: PinRecord[] }>(`/pins/channels/${channelId}`)
    setPinnedIds(new Set(data.pins.map((p) => p.entityId)))
  }

  const togglePin = async (messageId: string) => {
    if (pinnedIds.has(messageId)) {
      await api.delete(`/pins/messages/${messageId}`)
      setPinnedIds((prev) => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    } else {
      await api.post(`/pins/messages/${messageId}`)
      setPinnedIds((prev) => new Set(prev).add(messageId))
    }
  }

  const sendMessage = () => {
    if (!input.trim() || !activeChannel) return
    const tempId = `temp-${Date.now()}`
    send('chat:message', { channelId: activeChannel, content: input, tempId })
    // Optimistically add
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        channelId: activeChannel,
        authorId: user?.id || '',
        authorName: user?.name || '',
        content: input,
        replyToId: null,
        createdAt: new Date().toISOString(),
        editedAt: null,
      },
    ])
    setInput('')
  }

  const handleTyping = () => {
    if (activeChannel) {
      send('chat:typing', { channelId: activeChannel })
    }
  }

  const createChannel = async () => {
    if (!newChannelName.trim()) return
    await api.post('/chat/channels', { name: newChannelName, type: 'public' })
    setNewChannelName('')
    setShowNewChannel(false)
    void loadChannels()
  }

  const loadDMUsers = async () => {
    const data = await api.get<{ users: ChatUser[] }>('/chat/users')
    setDmUsers(data.users)
  }

  const startDM = async (targetUserId: string) => {
    const data = await api.post<{ channel: Channel }>(`/chat/dm/${targetUserId}`)
    setShowNewDM(false)
    setDmSearch('')
    await loadChannels()
    setActiveChannel(data.channel.id)
  }

  const openDMPicker = () => {
    setShowNewDM(!showNewDM)
    if (!showNewDM) void loadDMUsers()
  }

  const startEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id)
    setEditingMessageContent(msg.content)
  }

  const saveEditMessage = async () => {
    if (!editingMessageId || !editingMessageContent.trim()) return
    await api.patch(`/chat/messages/${editingMessageId}`, { content: editingMessageContent })
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingMessageId
          ? { ...m, content: editingMessageContent, editedAt: new Date().toISOString() }
          : m,
      ),
    )
    setEditingMessageId(null)
    setEditingMessageContent('')
  }

  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingMessageContent('')
  }

  const startEditChannel = () => {
    if (!activeChannelData) return
    setEditingChannelId(activeChannelData.id)
    setEditingChannelName(activeChannelData.name)
  }

  const saveEditChannel = async () => {
    if (!editingChannelId || !editingChannelName.trim()) return
    await api.patch(`/chat/channels/${editingChannelId}`, { name: editingChannelName })
    setEditingChannelId(null)
    setEditingChannelName('')
    void loadChannels()
  }

  const cancelEditChannel = () => {
    setEditingChannelId(null)
    setEditingChannelName('')
  }

  const scrollToMessage = (messageId: string) => {
    const el = messageRefs.current.get(messageId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-indigo', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo', 'ring-offset-2'), 2000)
    }
  }

  const filteredDMUsers = dmUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(dmSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(dmSearch.toLowerCase()),
  )

  const activeChannelData = channels.find((c) => c.id === activeChannel)

  // Split channels into groups
  const groupChannels = channels.filter((c) => c.type !== 'direct')
  const dmChannels = channels.filter((c) => c.type === 'direct')

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* Channel Sidebar */}
      <Card className="w-64 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Channels</h3>
          <button
            onClick={() => setShowNewChannel(!showNewChannel)}
            className="text-indigo text-lg leading-none"
          >
            +
          </button>
        </div>
        {showNewChannel && (
          <div className="p-2 border-b border-gray-100">
            <div className="flex gap-1">
              <Input
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="text-xs"
              />
              <Button size="sm" onClick={() => void createChannel()}>
                Add
              </Button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {groupChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${activeChannel === ch.id ? 'bg-indigo/5 text-indigo font-medium' : 'text-jet'}`}
            >
              <span># {ch.name}</span>
              {ch.unreadCount > 0 && (
                <span className="bg-lavender-blush text-coral text-xs px-1.5 py-0.5 rounded-full">
                  {ch.unreadCount}
                </span>
              )}
            </button>
          ))}

          {/* Direct Messages */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-french-gray uppercase tracking-wide">
              Direct Messages
            </span>
            <button onClick={openDMPicker} className="text-indigo text-lg leading-none">
              +
            </button>
          </div>
          {showNewDM && (
            <div className="px-2 pb-2">
              <Input
                placeholder="Search users..."
                value={dmSearch}
                onChange={(e) => setDmSearch(e.target.value)}
                className="text-xs mb-1"
              />
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded">
                {filteredDMUsers.length === 0 ? (
                  <p className="p-2 text-xs text-french-gray text-center">No users found</p>
                ) : (
                  filteredDMUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => void startDM(u.id)}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-gray text-white flex items-center justify-center text-xs shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{u.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          {dmChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${activeChannel === ch.id ? 'bg-indigo/5 text-indigo font-medium' : 'text-jet'}`}
            >
              <span>{ch.name}</span>
              {ch.unreadCount > 0 && (
                <span className="bg-lavender-blush text-coral text-xs px-1.5 py-0.5 rounded-full">
                  {ch.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-100 text-xs text-french-gray flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-teal' : 'bg-coral'}`} />
          {isConnected ? 'Connected' : 'Reconnecting...'}
        </div>
      </Card>

      {/* Message Area */}
      <Card className="flex-1 flex flex-col">
        {activeChannelData ? (
          <>
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              {editingChannelId === activeChannelData.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingChannelName}
                    onChange={(e) => setEditingChannelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveEditChannel()
                      if (e.key === 'Escape') cancelEditChannel()
                    }}
                    className="text-sm h-8 w-48"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => void saveEditChannel()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditChannel}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">
                    {activeChannelData.type === 'direct' ? '' : '# '}
                    {activeChannelData.name}
                  </h3>
                  {activeChannelData.type !== 'direct' && (
                    <button
                      onClick={startEditChannel}
                      className="p-1.5 rounded-md text-indigo bg-indigo/10 hover:bg-indigo/20 transition-colors"
                      title="Edit channel name"
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
                  <button
                    onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                    className={`p-1.5 rounded-md transition-colors ${showPinnedPanel ? 'text-white bg-indigo' : 'text-indigo bg-indigo/10 hover:bg-indigo/20'}`}
                    title="Pinned messages"
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
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                  {pinnedIds.size > 0 && (
                    <span className="text-xs text-french-gray">{pinnedIds.size} pinned</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    ref={(el) => {
                      if (el) messageRefs.current.set(msg.id, el)
                      else messageRefs.current.delete(msg.id)
                    }}
                    className={`flex gap-2 transition-all duration-300 rounded-lg ${msg.authorId === user?.id ? 'justify-end' : ''}`}
                  >
                    {msg.authorId !== user?.id && (
                      <div className="w-8 h-8 rounded-full bg-slate-gray text-white flex items-center justify-center text-xs shrink-0">
                        {(msg.authorName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`group/msg max-w-[70%] ${msg.authorId === user?.id ? 'bg-indigo text-white' : 'bg-gray-100'} rounded-[12px] px-3 py-2`}
                    >
                      {msg.authorId !== user?.id && (
                        <p className="text-xs font-medium mb-0.5">{msg.authorName || 'Unknown'}</p>
                      )}
                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-1">
                          <Input
                            value={editingMessageContent}
                            onChange={(e) => setEditingMessageContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void saveEditMessage()
                              if (e.key === 'Escape') cancelEditMessage()
                            }}
                            className="text-sm text-jet h-7"
                            autoFocus
                          />
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" onClick={() => void saveEditMessage()}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditMessage}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {pinnedIds.has(msg.id) && (
                            <span
                              className={`text-xs mb-0.5 block ${msg.authorId === user?.id ? 'text-white/60' : 'text-indigo'}`}
                            >
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
                          <p className="text-sm">
                            {msg.content}
                            {msg.editedAt && (
                              <span
                                className={`text-xs ml-1 ${msg.authorId === user?.id ? 'text-white/50' : 'text-french-gray'}`}
                              >
                                (edited)
                              </span>
                            )}
                          </p>
                          <div className="flex gap-1 mt-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <button
                              onClick={() => void togglePin(msg.id)}
                              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${msg.authorId === user?.id ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-french-gray hover:text-jet hover:bg-gray-200'}`}
                              title={pinnedIds.has(msg.id) ? 'Unpin message' : 'Pin message'}
                            >
                              <svg
                                className="w-3 h-3 inline mr-0.5"
                                fill={pinnedIds.has(msg.id) ? 'currentColor' : 'none'}
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
                              {pinnedIds.has(msg.id) ? 'Unpin' : 'Pin'}
                            </button>
                            {msg.authorId === user?.id && (
                              <button
                                onClick={() => startEditMessage(msg)}
                                className="text-xs px-1.5 py-0.5 rounded transition-colors text-white/60 hover:text-white hover:bg-white/10"
                              >
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                            )}
                          </div>
                        </>
                      )}
                      <p
                        className={`text-xs mt-1 ${msg.authorId === user?.id ? 'text-white/60' : 'text-french-gray'}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Pinned Messages Side Panel */}
              {showPinnedPanel && (
                <div className="w-72 border-l border-gray-100 flex flex-col shrink-0 bg-white">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
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
                      <h4 className="text-sm font-semibold text-jet">Pinned Messages</h4>
                    </div>
                    <button
                      onClick={() => setShowPinnedPanel(false)}
                      className="p-1 rounded-md text-french-gray hover:text-jet hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {messages.filter((m) => pinnedIds.has(m.id)).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-french-gray">
                        <svg
                          className="w-8 h-8 mb-2 opacity-40"
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
                        <p className="text-xs text-center">
                          No pinned messages yet.
                          <br />
                          Pin important messages to find them here.
                        </p>
                      </div>
                    ) : (
                      messages
                        .filter((m) => pinnedIds.has(m.id))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 hover:border-indigo/30 transition-colors cursor-pointer group/pin"
                            onClick={() => scrollToMessage(m.id)}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-5 h-5 rounded-full bg-slate-gray text-white flex items-center justify-center text-[10px] shrink-0">
                                {(m.authorName || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-jet truncate">
                                {m.authorName || 'Unknown'}
                              </span>
                              <span className="text-[10px] text-french-gray ml-auto shrink-0">
                                {new Date(m.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-jet/80 line-clamp-3 mb-1.5">{m.content}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-indigo opacity-0 group-hover/pin:opacity-100 transition-opacity">
                                Click to jump
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void togglePin(m.id)
                                }}
                                className="text-[10px] text-coral hover:text-coral/80 opacity-0 group-hover/pin:opacity-100 transition-opacity"
                              >
                                Unpin
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {typingUsers.length > 0 && (
              <div className="px-4 py-1 text-xs text-french-gray italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div className="px-4 py-2 border-t border-gray-100">
              <FileAttachments entityType="channel" entityId={activeChannelData.id} />
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  handleTyping()
                }}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-french-gray text-sm">
            Create or select a channel to start chatting
          </div>
        )}
      </Card>
    </div>
  )
}
