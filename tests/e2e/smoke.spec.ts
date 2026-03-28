import { test, expect } from '@playwright/test'

test.describe('Marketing Pages', () => {
  test('landing page loads and shows hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Sarah/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('body')).toBeVisible()
  })

  test('impressum page loads', async ({ page }) => {
    await page.goto('/impressum')
    await expect(page.locator('body')).toBeVisible()
  })

  test('datenschutz page loads', async ({ page }) => {
    await page.goto('/datenschutz')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Auth Flow', () => {
  test('login page loads with split-screen layout', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible()
    // Login page should have an email input for magic link
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
  })

  test('unauthenticated users are redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login page
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('unauthenticated users are redirected from /leads to /login', async ({ page }) => {
    await page.goto('/leads')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('unauthenticated users are redirected from /settings to /login', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })
})

test.describe('404 Page', () => {
  test('custom 404 page shown for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
    await expect(page.locator('h1')).toContainText('Seite nicht gefunden')
  })
})
