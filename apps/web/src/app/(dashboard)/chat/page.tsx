'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { WsMessage } from '@sentralyzed/shared/types/websocket'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    void loadChannels()
  }, [])

  useEffect(() => {
    if (!activeChannel) return
    void loadMessages(activeChannel)
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

    return () => {
      unsub()
      unsubTyping()
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

  const sendMessage = () => {
    if (!input.trim() || !activeChannel) return
    send('chat:message', { channelId: activeChannel, content: input })
    // Optimistically add
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
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
    void loadChannels()
    setActiveChannel(data.channel.id)
  }

  const openDMPicker = () => {
    setShowNewDM(!showNewDM)
    if (!showNewDM) void loadDMUsers()
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
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-sm">
                {activeChannelData.type === 'direct' ? '' : '# '}
                {activeChannelData.name}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.authorId === user?.id ? 'justify-end' : ''}`}
                >
                  {msg.authorId !== user?.id && (
                    <div className="w-8 h-8 rounded-full bg-slate-gray text-white flex items-center justify-center text-xs shrink-0">
                      {(msg.authorName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] ${msg.authorId === user?.id ? 'bg-indigo text-white' : 'bg-gray-100'} rounded-[12px] px-3 py-2`}
                  >
                    {msg.authorId !== user?.id && (
                      <p className="text-xs font-medium mb-0.5">{msg.authorName || 'Unknown'}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
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
            {typingUsers.length > 0 && (
              <div className="px-4 py-1 text-xs text-french-gray italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
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
