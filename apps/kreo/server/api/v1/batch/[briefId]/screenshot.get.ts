import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function fileExists(path: string): Promise<boolean> {
  try {
    await import('node:fs/promises').then(fs => fs.access(path))
    return true
  }
  catch {
    return false
  }
}

function getRunDir(runId?: number): string {
  const base = resolve('.claude/batch/runs')
  return runId ? resolve(base, String(runId)) : resolve(base, 'latest')
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès réservé aux administrateurs' })
  }

  const briefId = getRouterParam(event, 'briefId')
  const query = getQuery(event)
  const runDir = getRunDir(query.run ? Number(query.run) : undefined)

  // Load state to get slug
  const stateFile = resolve(runDir, 'state.json')
  if (!await fileExists(stateFile)) {
    throw createError({ statusCode: 404, message: 'Aucun batch trouvé' })
  }

  const state = JSON.parse(await readFile(stateFile, 'utf8'))
  const brief = state.briefs.find((b: { id: number }) => b.id === Number(briefId))
  if (!brief) {
    throw createError({ statusCode: 404, message: 'Brief non trouvé' })
  }

  const version = (query.version as string) || 'original'
  const filename = version === 'revised' ? `${brief.slug}-revised.png` : `${brief.slug}.png`
  const screenshotPath = resolve(runDir, `screenshots/${filename}`)

  if (!await fileExists(screenshotPath)) {
    throw createError({ statusCode: 404, message: 'Screenshot non trouvé' })
  }

  const buffer = await readFile(screenshotPath)
  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return buffer
})
