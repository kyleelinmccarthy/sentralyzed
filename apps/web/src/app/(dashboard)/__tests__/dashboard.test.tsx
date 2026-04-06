import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    get: mockGet,
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', name: 'Kylee Lin', email: 'kylee@test.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}))

import DashboardPage from '../page'

const mockItems = {
  tasks: [
    {
      id: 'task-1',
      title: 'Fix login bug',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-04-10',
      projectId: 'proj-1',
    },
    {
      id: 'task-2',
      title: 'Update docs',
      status: 'todo',
      priority: 'low',
      dueDate: null,
      projectId: 'proj-1',
    },
  ],
  events: [
    {
      id: 'event-1',
      title: 'Sprint planning',
      startTime: '2026-04-07T10:00:00Z',
      endTime: '2026-04-07T11:00:00Z',
      allDay: false,
      rsvpStatus: 'accepted',
    },
  ],
  goals: [
    {
      id: 'goal-1',
      title: 'Q2 revenue target',
      status: 'in_progress',
      progressPercentage: 40,
      targetDate: '2026-06-30',
      level: 'team',
    },
  ],
  feedbackItems: [
    { id: 'fb-1', title: 'Login page broken', category: 'bug', priority: 'high', status: 'open' },
  ],
  chatNotifications: [{ channelId: 'ch-1', channelName: 'general', unreadCount: 5 }],
  assignments: [
    {
      id: 'assign-1',
      entityType: 'project',
      entityId: 'proj-1',
      role: 'owner',
      createdAt: '2026-04-01T00:00:00Z',
    },
  ],
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ items: mockItems })
  })

  it('renders welcome message with user name', async () => {
    render(<DashboardPage />)
    expect(screen.getByText(/Welcome back, Kylee/)).toBeInTheDocument()
  })

  it('renders loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {})) // never resolves
    render(<DashboardPage />)
    expect(screen.getByText('Loading your items...')).toBeInTheDocument()
  })

  it('renders tasks from API response', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
      expect(screen.getByText('Update docs')).toBeInTheDocument()
    })
  })

  it('renders events from API response', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Sprint planning')).toBeInTheDocument()
    })
  })

  it('renders goals from API response', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Q2 revenue target')).toBeInTheDocument()
    })
  })

  it('renders feedback from API response', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Login page broken')).toBeInTheDocument()
    })
  })

  it('renders chat notification banner with unread count', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Unread messages')).toBeInTheDocument()
      expect(screen.getByText('#general')).toBeInTheDocument()
    })
  })

  it('renders empty state when no items', async () => {
    mockGet.mockResolvedValue({
      items: {
        tasks: [],
        events: [],
        goals: [],
        feedbackItems: [],
        chatNotifications: [],
        assignments: [],
      },
    })
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/No items assigned to you/)).toBeInTheDocument()
    })
  })

  it('filter tabs switch between All, Tasks, Events, Goals, and Feedback', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    })

    // Click Tasks tab
    fireEvent.click(screen.getByRole('button', { name: /Tasks/ }))
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('Update docs')).toBeInTheDocument()
    expect(screen.queryByText('Sprint planning')).not.toBeInTheDocument()

    // Click Events tab
    fireEvent.click(screen.getByRole('button', { name: /Events/ }))
    expect(screen.getByText('Sprint planning')).toBeInTheDocument()
    expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()

    // Click Goals tab
    fireEvent.click(screen.getByRole('button', { name: /Goals/ }))
    expect(screen.getByText('Q2 revenue target')).toBeInTheDocument()
    expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()

    // Click Feedback tab
    fireEvent.click(screen.getByRole('button', { name: /Feedback/ }))
    expect(screen.getByText('Login page broken')).toBeInTheDocument()
    expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()

    // Click All tab
    fireEvent.click(screen.getByRole('button', { name: /^All/ }))
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('Sprint planning')).toBeInTheDocument()
    expect(screen.getByText('Q2 revenue target')).toBeInTheDocument()
    expect(screen.getByText('Login page broken')).toBeInTheDocument()
  })

  it('calls API with dashboard endpoint', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/dashboard/my-items')
    })
  })
})
