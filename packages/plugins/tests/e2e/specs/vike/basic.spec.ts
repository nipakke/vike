import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')

  await page.screenshot({ path: 'screenshot2.png', fullPage: true })

  // await expect(page.locator('h1')).toBeVisible()
})

test('SSR: HTML tartalmaz szerver-renderelt tartalmat', async ({ request }) => {
  const res = await request.get('/')
  const html = await res.text()
  expect(html).toContain('hello from server')
})