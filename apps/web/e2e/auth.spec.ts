import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sentral' })).toBeVisible()
    await expect(page.getByText('Sign in to your workspace')).toBeVisible()
    await expect(page.getByText('Continue with Google')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('login form shows validation error for empty fields', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()
    // Browser native validation prevents submission
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toHaveAttribute('required')
  })

  test('forgot password page renders and submits', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('Reset Password')).toBeVisible()
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    await expect(page.getByText('receive a reset link')).toBeVisible()
  })

  test('register page requires invitation token', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Invitation Required')).toBeVisible()
  })

  test('register page with token shows form', async ({ page }) => {
    await page.goto('/register?token=test-token-123')
    await expect(page.getByText('Join Sentral')).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/.*login/)
  })
})
