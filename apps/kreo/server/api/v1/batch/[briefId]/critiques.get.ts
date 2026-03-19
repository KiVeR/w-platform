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

  const critiques: Record<string, unknown> = {}
  for (const role of ['marketing', 'ux', 'brand']) {
    const path = resolve(runDir, `critiques/${briefId}-${role}.json`)
    if (await fileExists(path)) {
      critiques[role] = JSON.parse(await readFile(path, 'utf8'))
    }
  }

  if (Object.keys(critiques).length === 0) {
    throw createError({ statusCode: 404, message: 'Critiques non trouvées' })
  }

  return { critiques }
})
