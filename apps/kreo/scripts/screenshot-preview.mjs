/**
 * Capture a screenshot of a landing page preview in Kreo editor.
 *
 * Usage: node scripts/screenshot-preview.mjs <contentId> [output] [--token <jwt>]
 *   contentId - The content ID to preview
 *   output    - Output path (default: generated-lp-preview.png)
 *   --token   - JWT access token (skips login form, avoids rate limits)
 *
 * Requires Kreo running locally (default: http://localhost:8002).
 */
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium } from '@playwright/test'

// Parse args (positional + --token flag)
const args = process.argv.slice(2)
const tokenIdx = args.indexOf('--token')
let token = null
if (tokenIdx !== -1) {
  token = args[tokenIdx + 1]
  args.splice(tokenIdx, 2)
}

const contentId = args[0]
const output = args[1] || 'generated-lp-preview.png'

if (!contentId) {
  console.error('Usage: node scripts/screenshot-preview.mjs <contentId> [output] [--token <jwt>]')
  process.exit(1)
}

// Ensure output directory exists
await mkdir(dirname(output), { recursive: true })

const BASE = process.env.KREO_BASE_URL || `http://localhost:${process.env.KREO_PORT || '8002'}`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  if (token) {
    // Inject token via localStorage — skip login form entirely
    await page.goto(`${BASE}/login`)
    await page.evaluate((t) => {
      localStorage.setItem('accessToken', t)
    }, token)
    await page.goto(`${BASE}/lp/${contentId}`)
    await page.waitForTimeout(2000)
  }
  else {
    // Login via form
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'Admin123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.goto(`${BASE}/lp/${contentId}`)
    await page.waitForTimeout(2000)
  }

  // Switch to preview mode via Pinia store (avoids overlay issues)
  await page.evaluate(() => {
    const pinia = window.__pinia
    if (pinia) {
      const ui = pinia._s.get('ui')
      if (ui)
        ui.setMode('preview')
    }
  })
  // Fallback: force click if JS store not available
  await page.waitForTimeout(500)
  const isPreview = await page.evaluate(() => document.querySelector('.preview-mode') !== null)
  if (!isPreview) {
    await page.locator('button[title="Aperçu"]').click({ force: true })
  }
  await page.waitForTimeout(2000)

  // Wait for Google Fonts to finish loading
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  // Screenshot the preview frame with scrolling support
  const frame = page.locator('.preview-mode, .mobile-frame, .center-canvas').first()

  // Find the scrollable container inside the mobile frame
  const scrollContainer = await page.evaluate(() => {
    // Priority selectors for the scrollable content area
    const candidates = [
      '.app-content',
      '.mobile-frame__content',
      '.mobile-frame .overflow-y-auto',
      '.preview-content',
      '.canvas-content',
    ]
    for (const sel of candidates) {
      const el = document.querySelector(sel)
      if (el && el.scrollHeight > el.clientHeight + 50) {
        return { selector: sel, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
      }
    }
    // Fallback: find any scrollable element with overflow auto/scroll
    const all = document.querySelectorAll('*')
    for (const el of all) {
      const cs = getComputedStyle(el)
      const overflowY = cs.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50 && el.clientHeight > 100) {
        el.setAttribute('data-screenshot-scroll', 'true')
        return { selector: '[data-screenshot-scroll]', scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
      }
    }
    return null
  })

  if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight + 50) {
    // Multiple screenshots needed
    const { selector, scrollHeight, clientHeight } = scrollContainer
    const scrollStep = Math.floor(clientHeight * 0.85) // overlap slightly
    const totalScreenshots = Math.min(Math.ceil(scrollHeight / scrollStep), 10) // cap at 10

    const baseName = output.replace(/\.png$/, '')
    for (let i = 0; i < totalScreenshots; i++) {
      const scrollTop = i * scrollStep
      await page.evaluate(({ sel, top }) => {
        const el = document.querySelector(sel)
        if (el)
          el.scrollTop = top
      }, { sel: selector, top: scrollTop })
      await page.waitForTimeout(400)

      const screenshotPath = totalScreenshots === 1 ? output : `${baseName}-${i + 1}.png`
      await frame.screenshot({ path: screenshotPath })
      console.log(`Screenshot saved to ${screenshotPath}`)
    }
  }
  else {
    // Single screenshot - content fits in view
    await frame.screenshot({ path: output })
    console.log(`Screenshot saved to ${output}`)
  }
}
catch (err) {
  console.error('Screenshot failed:', err.message)
  process.exit(1)
}
finally {
  await browser.close()
}
