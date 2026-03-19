import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface BriefState {
  id: number
  sector: string
  slug: string
  contentId: number | null
  title: string | null
  generation: string
  critique: string
  vote: string
  humanReview: string
  revision: string
}

interface BatchState {
  runId: number
  phase: string
  startedAt: string
  briefs: BriefState[]
  errors: Array<{ phase: string, briefId: number, error: string }>
}

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

  const query = getQuery(event)
  const runDir = getRunDir(query.run ? Number(query.run) : undefined)

  const stateFile = resolve(runDir, 'state.json')
  if (!await fileExists(stateFile)) {
    throw createError({ statusCode: 404, message: 'Aucun batch trouvé' })
  }

  const state: BatchState = JSON.parse(await readFile(stateFile, 'utf8'))

  // Enrich each brief with scores and human review status
  const enriched = await Promise.all(state.briefs.map(async (brief) => {
    let avgScore: number | null = null
    let acceptedCount = 0
    let totalMods = 0
    let hasHumanReview = false

    // Read critique scores
    const scores: number[] = []
    for (const role of ['marketing', 'ux', 'brand']) {
      const critiquePath = resolve(runDir, `critiques/${brief.id}-${role}.json`)
      if (await fileExists(critiquePath)) {
        try {
          const critique = JSON.parse(await readFile(critiquePath, 'utf8'))
          if (typeof critique.averageScore === 'number')
            scores.push(critique.averageScore)
        }
        catch {}
      }
    }
    if (scores.length > 0)
      avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // Read consensus for modification counts
    const consensusPath = resolve(runDir, `votes/${brief.id}-consensus.json`)
    if (await fileExists(consensusPath)) {
      try {
        const consensus = JSON.parse(await readFile(consensusPath, 'utf8'))
        const mods = consensus.acceptedModifications || consensus.modifications || []
        totalMods = mods.length
        acceptedCount = mods.filter((m: { status?: string }) => m.status === 'accepted').length || totalMods
      }
      catch {}
    }

    // Check human review
    const humanReviewPath = resolve(runDir, `human-review/${brief.id}.json`)
    hasHumanReview = await fileExists(humanReviewPath)

    return {
      ...brief,
      avgScore,
      acceptedCount,
      totalMods,
      hasHumanReview,
    }
  }))

  return {
    runId: state.runId,
    phase: state.phase,
    startedAt: state.startedAt,
    errors: state.errors,
    briefs: enriched,
  }
})
