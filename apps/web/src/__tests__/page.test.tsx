import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../app/login/page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}))

describe('Login Page', () => {
  it('renders the login form', () => {
    render(<LoginPage />)
    expect(screen.getByAltText('Sentral')).toBeInTheDocument()
    expect(screen.getByText('Sentral')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your workspace')).toBeInTheDocument()
  })

  it('renders Google OAuth button', () => {
    render(<LoginPage />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
