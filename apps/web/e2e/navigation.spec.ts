import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/login')
    const link = page.getByRole('link', { name: 'Forgot password?' })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/.*forgot-password/)
  })

  test('forgot password has back to login link', async ({ page }) => {
    await page.goto('/forgot-password')
    const link = page.getByRole('link', { name: 'Back to login' })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/.*login/)
  })
})
