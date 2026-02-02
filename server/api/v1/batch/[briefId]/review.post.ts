import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { z } from 'zod'

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

const reviewSchema = z.object({
  modifications: z.array(z.object({
    index: z.number(),
    action: z.enum(['accept', 'reject', 'edit']),
    editedDescription: z.string().optional(),
  })),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès réservé aux administrateurs' })
  }

  const briefId = getRouterParam(event, 'briefId')
  const query = getQuery(event)
  const runDir = getRunDir(query.run ? Number(query.run) : undefined)

  const body = await readBody(event)
  const result = reviewSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: 'Données invalides', data: result.error.flatten() })
  }

  // Write human review file
  const humanReviewDir = resolve(runDir, 'human-review')
  await mkdir(humanReviewDir, { recursive: true })

  const reviewData = {
    briefId: Number(briefId),
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.email,
    modifications: result.data.modifications,
  }

  await writeFile(
    resolve(humanReviewDir, `${briefId}.json`),
    JSON.stringify(reviewData, null, 2),
  )

  // Update state.json
  const stateFile = resolve(runDir, 'state.json')
  if (await fileExists(stateFile)) {
    const state = JSON.parse(await readFile(stateFile, 'utf8'))
    const brief = state.briefs.find((b: { id: number }) => b.id === Number(briefId))
    if (brief) {
      brief.humanReview = 'done'
      await writeFile(stateFile, JSON.stringify(state, null, 2))
    }
  }

  return { success: true, briefId: Number(briefId) }
})
