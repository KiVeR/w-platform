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

  const consensusPath = resolve(runDir, `votes/${briefId}-consensus.json`)
  if (!await fileExists(consensusPath)) {
    throw createError({ statusCode: 404, message: 'Consensus non trouvé' })
  }

  const consensus = JSON.parse(await readFile(consensusPath, 'utf8'))

  // Load human review if exists
  const humanReviewPath = resolve(runDir, `human-review/${briefId}.json`)
  let humanReview = null
  if (await fileExists(humanReviewPath)) {
    humanReview = JSON.parse(await readFile(humanReviewPath, 'utf8'))
  }

  return { consensus, humanReview }
})
