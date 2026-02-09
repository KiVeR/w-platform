import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium } from '@playwright/test'

const token = process.argv[2]
const output = '/Users/KiVeR/Sites/wllp/kreo/.claude/batch/runs/7/screenshots/prevalia-assurance-auto-jeune-beautified.png'
await mkdir(dirname(output), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  // Inject token via localStorage then navigate to editor
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' })
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t)
  }, token)

  // Navigate to editor page
  await page.goto('http://localhost:5174/lp/130', { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(3000)

  console.log('Current URL:', page.url())

  // Check if we're still on login (token expired)
  if (page.url().includes('/login')) {
    console.error('Token rejected, still on login page')
    process.exit(1)
  }

  // Wait for the mode segmented buttons to appear
  await page.waitForSelector('.mode-segment', { timeout: 10000 }).catch(() => {
    console.log('Mode segment buttons not found')
  })

  // Click the preview (Aperçu) button - it has title="Aperçu"
  const previewBtn = page.locator('button[title="Aperçu"]')
  if (await previewBtn.count() > 0) {
    await previewBtn.click({ force: true })
    console.log('Clicked preview button')
    await page.waitForTimeout(2000)
  }
  else {
    // Try aria-label
    const previewBtn2 = page.locator('button[aria-label="Aperçu"]')
    if (await previewBtn2.count() > 0) {
      await previewBtn2.click({ force: true })
      console.log('Clicked preview button via aria-label')
      await page.waitForTimeout(2000)
    }
    else {
      console.log('Preview button not found, trying to list buttons...')
      const btns = await page.locator('button').all()
      for (const b of btns) {
        const t = await b.getAttribute('title')
        const al = await b.getAttribute('aria-label')
        if (t || al)
          console.log('  Button:', t, '|', al)
      }
    }
  }

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  const frame = page.locator('.preview-mode, .mobile-frame, .center-canvas').first()
  if (await frame.count() > 0) {
    // Check for scrollable content
    const scrollInfo = await page.evaluate(() => {
      const candidates = ['.app-content', '.mobile-frame__content', '.mobile-frame .overflow-y-auto', '.preview-content', '.canvas-content']
      for (const sel of candidates) {
        const el = document.querySelector(sel)
        if (el && el.scrollHeight > el.clientHeight + 50) {
          return { selector: sel, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
        }
      }
      // Fallback: find any scrollable
      const all = document.querySelectorAll('*')
      for (const el of all) {
        const cs = getComputedStyle(el)
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50 && el.clientHeight > 100) {
          el.setAttribute('data-screenshot-scroll', 'true')
          return { selector: '[data-screenshot-scroll]', scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
        }
      }
      return null
    })

    if (scrollInfo && scrollInfo.scrollHeight > scrollInfo.clientHeight + 50) {
      const { selector, scrollHeight, clientHeight } = scrollInfo
      const scrollStep = Math.floor(clientHeight * 0.85)
      const totalScreenshots = Math.min(Math.ceil(scrollHeight / scrollStep), 10)
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
      await frame.screenshot({ path: output })
      console.log(`Screenshot saved to ${output}`)
    }
  }
  else {
    console.log('No frame found, taking full page screenshot')
    await page.screenshot({ path: output, fullPage: false })
    console.log(`Full page screenshot saved to ${output}`)
  }
}
catch (e) {
  console.error('Error:', e.message)
  process.exit(1)
}
finally {
  await browser.close()
}
