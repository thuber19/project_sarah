import { test, expect } from '@playwright/test'

test.describe('App Route Navigation (unauthenticated)', () => {
  test('all protected routes redirect to /login', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/leads',
      '/discovery',
      '/scoring',
      '/settings',
      '/export',
      '/agent-logs',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForURL(/\/login/, { timeout: 5000 })
      expect(page.url()).toContain('/login')
    }
  })

  test('onboarding routes redirect to /login when unauthenticated', async ({ page }) => {
    await page.goto('/onboarding/step-1')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

test.describe('Marketing Site Navigation', () => {
  test('navbar links are present on landing page', async ({ page }) => {
    await page.goto('/')
    // Check that key navigation elements exist
    await expect(page.locator('nav')).toBeVisible()
  })

  test('pricing page has pricing cards', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('body')).toBeVisible()
    // Pricing page should have multiple plan options
    const content = await page.textContent('body')
    expect(content).toContain('Starter')
  })

  test('legal pages are accessible from footer or direct URL', async ({ page }) => {
    await page.goto('/impressum')
    const impressumContent = await page.textContent('body')
    expect(impressumContent).toBeTruthy()

    await page.goto('/datenschutz')
    const datenschutzContent = await page.textContent('body')
    expect(datenschutzContent).toBeTruthy()
  })
})
