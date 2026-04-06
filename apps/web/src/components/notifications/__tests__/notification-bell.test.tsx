import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// Mock the API client
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ notifications: [], count: 0 }),
    patch: vi.fn().mockResolvedValue({}),
  },
  ApiError: class extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

// Mock useWebSocket
const mockOn = vi.fn().mockReturnValue(() => {})
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    on: mockOn,
    send: vi.fn(),
    isConnected: true,
  }),
}))

import { NotificationBell } from '../notification-bell'
import { useNotificationStore } from '@/stores/notifications'

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    })
  })

  it('renders the bell icon', () => {
    render(<NotificationBell />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('shows unread count badge when count > 0', () => {
    useNotificationStore.setState({ unreadCount: 5 })
    render(<NotificationBell />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not show badge when count is 0', () => {
    useNotificationStore.setState({ unreadCount: 0 })
    render(<NotificationBell />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows 99+ when count exceeds 99', () => {
    useNotificationStore.setState({ unreadCount: 150 })
    render(<NotificationBell />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText('Notifications'))
    // Wait for async fetchNotifications to complete and show empty state
    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument()
    })
  })

  it('shows notification items when present', () => {
    // Pre-set state and override fetchNotifications to avoid async loading
    useNotificationStore.setState({
      notifications: [
        {
          notification: {
            id: 'n1',
            userId: 'u1',
            activityId: 'a1',
            readAt: null,
            createdAt: new Date().toISOString(),
          },
          activity: {
            id: 'a1',
            action: 'assigned',
            entityType: 'task',
            entityId: 'task-1',
            metadata: { taskTitle: 'Fix login bug', actorName: 'Alice' },
            actorId: 'actor-1',
            createdAt: new Date().toISOString(),
          },
          actor: { name: 'Alice' },
        },
      ],
      unreadCount: 1,
      isLoading: false,
      fetchNotifications: async () => {},
    })

    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText('Notifications'))
    expect(screen.getByText(/Alice assigned you to "Fix login bug"/)).toBeInTheDocument()
  })

  it('subscribes to WebSocket notification:new event', () => {
    render(<NotificationBell />)
    expect(mockOn).toHaveBeenCalledWith('notification:new', expect.any(Function))
  })
})
