#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Multi-agent batch LP generation pipeline.
 *
 * Usage:
 *   yarn batch-lp run                          # Full pipeline (20 LPs)
 *   yarn batch-lp run --max-parallel 3         # Limit concurrency
 *   yarn batch-lp run --briefs 1,8,20          # Specific briefs only
 *   yarn batch-lp run --resume-from critique   # Resume from phase
 *   yarn batch-lp status                       # Show current state
 *   yarn batch-lp report                       # Show final report
 */

import type { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { access, mkdir, readdir, readFile, symlink, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineCommand, runMain } from 'citty'
import { validateDesignTokens } from '../../shared/utils/design-tokens'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:5174'
const AUTH_EMAIL = 'admin@test.com'
const AUTH_PASSWORD = 'Admin123!'
const BATCH_BASE = resolve('.claude/batch/runs')
const PROMPTS_DIR = resolve('.claude/prompts/batch')
const CLAUDE_TIMEOUT = 15 * 60 * 1000 // 15 min per agent
const MAX_RETRIES = 1 // Auto-retry failed briefs once

// ANSI colors (same pattern as user.ts)
const c = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  gray: '\x1B[90m',
  magenta: '\x1B[35m',
}

const log = {
  success: (msg: string) => console.log(`${c.green}✓ ${msg}${c.reset}`),
  error: (msg: string) => console.log(`${c.red}✗ ${msg}${c.reset}`),
  info: (msg: string) => console.log(`${c.blue}ℹ ${msg}${c.reset}`),
  warn: (msg: string) => console.log(`${c.yellow}⚠ ${msg}${c.reset}`),
  phase: (msg: string) => console.log(`\n${c.bold}${c.magenta}═══ ${msg} ═══${c.reset}\n`),
  agent: (id: number, msg: string) => console.log(`${c.cyan}  [Brief ${id}]${c.reset} ${msg}`),
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Brief {
  id: number
  sector: string
  slug: string
  prompt: string
}

interface BriefState {
  id: number
  sector: string
  slug: string
  contentId: number | null
  title: string | null
  generation: 'pending' | 'done' | 'error'
  critique: 'pending' | 'done' | 'error'
  vote: 'pending' | 'done' | 'error'
  humanReview: 'pending' | 'done' | 'skipped'
  revision: 'pending' | 'done' | 'error'
  beautification: 'pending' | 'done' | 'error' | 'skipped'
  reCritique: 'pending' | 'done' | 'error' | 'skipped'
}

interface RunSummary {
  id: number
  date: string
  avgScore: number
  topIssue: string
}

interface State {
  runId: number
  phase: string
  config: { maxParallel: number }
  startedAt: string
  briefs: BriefState[]
  errors: Array<{ phase: string, briefId: number, error: string }>
  runs: RunSummary[]
}

// ---------------------------------------------------------------------------
// Creative Diversity System
// ---------------------------------------------------------------------------

const STYLE_PROFILES = ['minimal', 'modern', 'bold', 'elegant', 'playful'] as const
const LAYOUT_PATTERNS = ['funnel', 'showcase', 'story', 'asymmetric', 'form-first'] as const
const COLOR_MOODS = ['vibrant', 'muted', 'monochrome', 'warm', 'cool'] as const

type StyleProfile = typeof STYLE_PROFILES[number]
type LayoutPattern = typeof LAYOUT_PATTERNS[number]
type ColorMood = typeof COLOR_MOODS[number]

interface CreativeSeed {
  styleProfile: StyleProfile
  layoutPattern: LayoutPattern
  colorMood: ColorMood
}

function getCreativeSeed(briefId: number): CreativeSeed {
  return {
    styleProfile: STYLE_PROFILES[briefId % STYLE_PROFILES.length],
    layoutPattern: LAYOUT_PATTERNS[(briefId + 2) % LAYOUT_PATTERNS.length],
    colorMood: COLOR_MOODS[(briefId + 4) % COLOR_MOODS.length],
  }
}

function formatCreativeSeedVars(seed: CreativeSeed): Record<string, string> {
  return {
    STYLE_PROFILE: seed.styleProfile,
    LAYOUT_PATTERN: seed.layoutPattern,
    COLOR_MOOD: seed.colorMood,
  }
}

// ---------------------------------------------------------------------------
// Sectors (stable IDs, briefs generated dynamically by Claude agent)
// ---------------------------------------------------------------------------

const SECTORS: { id: number, sector: string }[] = [
  { id: 1, sector: 'restauration-rapide' },
  { id: 2, sector: 'banque-assurance' },
  { id: 3, sector: 'mode-pret-a-porter' },
  { id: 4, sector: 'automobile' },
  { id: 5, sector: 'immobilier' },
  { id: 6, sector: 'fitness' },
  { id: 7, sector: 'telecoms' },
  { id: 8, sector: 'cosmetique-beaute' },
  { id: 9, sector: 'education-formation' },
  { id: 10, sector: 'voyage-tourisme' },
  { id: 11, sector: 'sante-pharmacie' },
  { id: 12, sector: 'grande-distribution' },
  { id: 13, sector: 'evenementiel' },
  { id: 14, sector: 'ong-association' },
  { id: 15, sector: 'b2b-saas' },
  { id: 16, sector: 'ecommerce-alimentaire' },
  { id: 17, sector: 'luxe-horlogerie' },
  { id: 18, sector: 'sport-club-pro' },
  { id: 19, sector: 'collectivite' },
  { id: 20, sector: 'jeu-concours' },
]

// Mutable — populated by phaseBriefGeneration() or loaded from briefs.json
let BRIEFS: Brief[] = []

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  }
  catch {
    return false
  }
}

async function getNextRunId(): Promise<number> {
  try {
    const entries = await readdir(BATCH_BASE)
    const ids = entries.map(Number).filter(n => !Number.isNaN(n))
    return ids.length > 0 ? Math.max(...ids) + 1 : 1
  }
  catch {
    return 1
  }
}

function getRunDir(runId: number): string {
  return resolve(BATCH_BASE, String(runId))
}

async function getLatestRunDir(): Promise<string | null> {
  const latestLink = resolve(BATCH_BASE, 'latest')
  try {
    const stateFile = resolve(latestLink, 'state.json')
    if (await fileExists(stateFile))
      return latestLink
  }
  catch {}
  return null
}

async function updateLatestSymlink(runId: number): Promise<void> {
  const latestLink = resolve(BATCH_BASE, 'latest')
  try {
    await unlink(latestLink)
  }
  catch {}
  await symlink(String(runId), latestLink)
}

async function loadState(runDir: string): Promise<State | null> {
  const stateFile = resolve(runDir, 'state.json')
  if (!await fileExists(stateFile))
    return null
  return JSON.parse(await readFile(stateFile, 'utf8'))
}

async function saveState(state: State, runDir: string): Promise<void> {
  await writeFile(resolve(runDir, 'state.json'), JSON.stringify(state, null, 2))
}

function initState(maxParallel: number, briefIds: number[]): State {
  const briefs = BRIEFS
    .filter(b => briefIds.length === 0 || briefIds.includes(b.id))
    .map(b => ({
      id: b.id,
      sector: b.sector,
      slug: b.slug,
      contentId: null,
      title: null,
      generation: 'pending' as const,
      critique: 'pending' as const,
      vote: 'pending' as const,
      humanReview: 'pending' as const,
      revision: 'pending' as const,
      beautification: 'pending' as const,
      reCritique: 'pending' as const,
    }))

  return {
    runId: 1,
    phase: 'generation',
    config: { maxParallel },
    startedAt: new Date().toISOString(),
    briefs,
    errors: [],
    runs: [],
  }
}

async function loadPromptTemplate(name: string): Promise<string> {
  return readFile(resolve(PROMPTS_DIR, `${name}.md`), 'utf8')
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, String(value))
  }
  return result
}

interface StreamEvent {
  type?: string
  delta?: { text?: string }
  result?: string
  subtype?: string
}

function runClaude(prompt: string, label?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--verbose',
      '--output-format',
      'stream-json',
      '--dangerously-skip-permissions',
      '--allowedTools',
      'Read',
      'Write',
      'Edit',
      'Bash',
      'Glob',
      'Grep',
    ]
    const child = spawn('claude', args, {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const resultChunks: string[] = []
    let stderr = ''
    let lineBuffer = ''
    const tag = label ? `${c.cyan}[${label}]${c.reset} ` : ''
    let toolCount = 0

    child.stdout.on('data', (data: Buffer) => {
      lineBuffer += data.toString()
      const lines = lineBuffer.split('\n')
      lineBuffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim())
          continue
        try {
          const event = JSON.parse(line) as StreamEvent

          if (label) {
            // Parallel mode: compact activity indicators
            if (event.type === 'content_block_start') {
              toolCount++
              if (toolCount % 5 === 0)
                process.stdout.write(`${tag}${c.gray}${toolCount} steps...${c.reset}\n`)
            }
          }
          else {
            // Solo mode: stream full text
            if (event.type === 'content_block_delta' && event.delta?.text) {
              process.stdout.write(`${c.gray}${event.delta.text}${c.reset}`)
            }
          }

          if (event.type === 'result' && event.result) {
            resultChunks.push(event.result)
          }
        }
        catch {
          // Not JSON, skip
        }
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (stderr && process.env.DEBUG)
        console.error(`[DEBUG stderr] ${stderr}`)
      if (code !== 0) {
        reject(new Error(`Claude agent failed (exit ${code}):\n${stderr}`))
      }
      else {
        resolve(resultChunks.join(''))
      }
    })

    child.on('error', (err) => {
      reject(new Error(`Claude agent spawn failed: ${err.message}`))
    })

    child.stdin.write(prompt)
    child.stdin.end()

    setTimeout(() => {
      child.kill()
      reject(new Error(`Claude agent timed out after ${CLAUDE_TIMEOUT / 1000}s`))
    }, CLAUDE_TIMEOUT)
  })
}

async function runInBatches<T>(
  items: T[],
  maxParallel: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += maxParallel) {
    const batch = items.slice(i, i + maxParallel)
    const batchNum = Math.floor(i / maxParallel) + 1
    const totalBatches = Math.ceil(items.length / maxParallel)
    log.info(`Batch ${batchNum}/${totalBatches} (${batch.length} agents)`)
    await Promise.allSettled(batch.map(fn))
  }
}

interface GenerationFeedback {
  contentId?: number
  title?: string
  [key: string]: unknown
}

function parseFeedback(output: string): GenerationFeedback | null {
  const match = output.match(/FEEDBACK_START\n([\s\S]*?)\nFEEDBACK_END/)
  if (!match)
    return null
  try {
    return JSON.parse(match[1])
  }
  catch {
    return null
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function agentLabel(state: State, label: string): string | undefined {
  return state.config.maxParallel === 1 ? undefined : label
}

async function logDesignTokenCompliance(briefId: number, runDir: string): Promise<void> {
  const lpFile = resolve(runDir, `lp-${briefId}.json`)
  if (!await fileExists(lpFile))
    return
  try {
    const design = JSON.parse(await readFile(lpFile, 'utf8'))
    const widgets = design.widgets || []
    const result = validateDesignTokens(widgets)
    const pct = (result.complianceRate * 100).toFixed(0)
    if (result.valid) {
      log.agent(briefId, `${c.green}Design tokens: 100% compliant${c.reset}`)
    }
    else {
      log.agent(briefId, `${c.yellow}Design tokens: ${pct}% compliant (${result.violations.length} violations)${c.reset}`)
      for (const v of result.violations.slice(0, 5)) {
        log.agent(briefId, `  ${c.gray}${v.widgetId}.${v.property}: ${v.value} → ${v.nearestToken}${c.reset}`)
      }
    }
  }
  catch {
    // JSON parse error — skip validation
  }
}

// ---------------------------------------------------------------------------
// Phase 0: Brief generation
// ---------------------------------------------------------------------------

async function phaseBriefGeneration(runDir: string, briefIds: number[]): Promise<void> {
  const briefsFile = resolve(runDir, 'briefs.json')

  // If briefs.json already exists (resume), just load it
  if (await fileExists(briefsFile)) {
    BRIEFS = JSON.parse(await readFile(briefsFile, 'utf8'))
    log.info(`Loaded ${BRIEFS.length} briefs from existing briefs.json`)
    return
  }

  log.phase('PHASE 0 — BRIEF GENERATION')

  const sectors = SECTORS.filter(s => briefIds.length === 0 || briefIds.includes(s.id))
  const sectorsText = sectors.map(s => `${s.id}:${s.sector}`).join(', ')

  log.info(`Generating briefs for ${sectors.length} sectors: ${sectorsText}`)

  const template = await loadPromptTemplate('brief-generator')
  const prompt = fillTemplate(template, {
    SECTORS_TO_GENERATE: sectorsText,
    BATCH_DIR: runDir,
  })

  await runClaude(prompt)

  // Load and validate
  if (!await fileExists(briefsFile)) {
    throw new Error('Brief generation agent did not produce briefs.json')
  }

  BRIEFS = JSON.parse(await readFile(briefsFile, 'utf8'))

  // Validate all requested sectors are covered
  const generatedIds = new Set(BRIEFS.map(b => b.id))
  const missing = sectors.filter(s => !generatedIds.has(s.id))
  if (missing.length > 0) {
    log.warn(`Missing briefs for sectors: ${missing.map(s => `${s.id}:${s.sector}`).join(', ')}`)
  }

  log.success(`Generated ${BRIEFS.length} briefs`)
}

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

async function preflight(runDir: string): Promise<string | false> {
  // Check server
  try {
    const res = await fetch(`${BASE_URL}/api/v1/health`)
    if (!res.ok)
      throw new Error('not ok')
    log.success('Server running on port 5174')
  }
  catch {
    log.error('Server not running. Start it with: yarn dev')
    return false
  }

  // Auth — get token once for all agents
  let token = ''
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    })
    const data = await res.json() as { accessToken?: string }
    if (!data.accessToken)
      throw new Error('no token')
    token = data.accessToken
    log.success('Authentication OK (token obtained for agents)')
  }
  catch {
    log.error('Authentication failed. Check credentials.')
    return false
  }

  // Create directories in run dir
  for (const dir of ['critiques', 'votes', 'screenshots', 'feedback', 'human-review'])
    await mkdir(resolve(runDir, dir), { recursive: true })
  log.success(`Directories created in ${runDir}`)

  return token
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

async function generateSingleBrief(
  brief: Brief,
  briefState: BriefState,
  template: string,
  token: string,
  runDir: string,
  state: State,
  isRetry = false,
): Promise<void> {
  const retryTag = isRetry ? `${c.yellow}Retry${c.reset} ` : ''
  const creativeSeed = getCreativeSeed(brief.id)
  log.agent(brief.id, `${retryTag}Generating ${brief.sector} [${creativeSeed.styleProfile}/${creativeSeed.layoutPattern}/${creativeSeed.colorMood}]...`)

  try {
    const prompt = fillTemplate(template, {
      BRIEF_ID: brief.id,
      BRIEF_TEXT: brief.prompt,
      SLUG: brief.slug,
      LP_TITLE: brief.sector,
      ACCESS_TOKEN: token,
      BATCH_DIR: runDir,
      ...formatCreativeSeedVars(creativeSeed),
    })

    const output = await runClaude(prompt, agentLabel(state, `Brief ${brief.id}`))

    const feedback = parseFeedback(output)
    if (feedback) {
      await writeFile(
        resolve(runDir, `feedback/generation-${brief.id}.json`),
        JSON.stringify(feedback, null, 2),
      )
      if (typeof feedback.contentId === 'number')
        briefState.contentId = feedback.contentId
      if (typeof feedback.title === 'string')
        briefState.title = feedback.title
    }

    await logDesignTokenCompliance(brief.id, runDir)

    briefState.generation = 'done'
    log.agent(brief.id, `${c.green}Done${isRetry ? ' (retry)' : ''}${c.reset}`)
  }
  catch (err) {
    briefState.generation = 'error'
    state.errors.push({ phase: 'generation', briefId: brief.id, error: errorMessage(err) })
    log.agent(brief.id, `${c.red}${isRetry ? 'Retry failed' : 'Failed'}: ${errorMessage(err)}${c.reset}`)
  }

  state.phase = 'generation'
  await saveState(state, runDir)
}

async function phaseGeneration(state: State, token: string, runDir: string): Promise<void> {
  log.phase('PHASE 1 — GENERATION')
  const template = await loadPromptTemplate('generator')
  const pending = state.briefs.filter(b => b.generation === 'pending')

  if (pending.length === 0) {
    log.info('All briefs already generated, skipping')
    return
  }

  log.info(`${pending.length} briefs to generate`)

  await runInBatches(pending, state.config.maxParallel, async (briefState) => {
    const brief = BRIEFS.find(b => b.id === briefState.id)!
    await generateSingleBrief(brief, briefState, template, token, runDir, state)
  })

  // Auto-retry failed briefs
  const failed = state.briefs.filter(b => b.generation === 'error')
  if (failed.length > 0 && MAX_RETRIES > 0) {
    log.info(`${c.yellow}Retrying ${failed.length} failed brief(s)...${c.reset}`)
    for (const briefState of failed) {
      briefState.generation = 'pending'
      state.errors = state.errors.filter(e => !(e.phase === 'generation' && e.briefId === briefState.id))
    }
    await runInBatches(failed, state.config.maxParallel, async (briefState) => {
      const brief = BRIEFS.find(b => b.id === briefState.id)!
      await generateSingleBrief(brief, briefState, template, token, runDir, state, true)
    })
  }
}

async function phaseCritique(state: State, runDir: string): Promise<void> {
  log.phase('PHASE 2 — CRITIQUE')
  const roles = ['critic-marketing', 'critic-ux', 'critic-brand', 'critic-ui'] as const
  const generated = state.briefs.filter(b => b.generation === 'done' && b.critique === 'pending')

  if (generated.length === 0) {
    log.info('All critiques already done, skipping')
    return
  }

  log.info(`${generated.length} LPs to critique (×4 reviewers = ${generated.length * 4} agents)`)

  // Build flat list of (brief, role) pairs
  const tasks = generated.flatMap(b => roles.map(role => ({ briefState: b, role })))

  await runInBatches(tasks, state.config.maxParallel, async ({ briefState, role }) => {
    const brief = BRIEFS.find(b => b.id === briefState.id)!
    const roleName = role.replace('critic-', '')
    log.agent(brief.id, `${roleName} reviewing...`)

    try {
      const template = await loadPromptTemplate(role)
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        SECTOR: brief.sector,
        SLUG: brief.slug,
        BRIEF_TEXT: brief.prompt,
        BATCH_DIR: runDir,
      })

      await runClaude(prompt, agentLabel(state, `B${brief.id} ${roleName}`))
      log.agent(brief.id, `${roleName} ${c.green}done${c.reset}`)
    }
    catch (err) {
      state.errors.push({ phase: 'critique', briefId: brief.id, error: `${role}: ${errorMessage(err)}` })
      log.agent(brief.id, `${roleName} ${c.red}failed${c.reset}`)
    }
  })

  // Mark critique as done for briefs that have all 4 files
  for (const b of generated) {
    const allDone = await Promise.all(
      ['marketing', 'ux', 'brand', 'ui'].map(r => fileExists(resolve(runDir, `critiques/${b.id}-${r}.json`))),
    )
    b.critique = allDone.every(Boolean) ? 'done' : 'error'
  }

  state.phase = 'critique'
  await saveState(state, runDir)
}

async function phaseVote(state: State, runDir: string): Promise<void> {
  log.phase('PHASE 3 — VOTE & CONSENSUS')
  const template = await loadPromptTemplate('arbiter')
  const ready = state.briefs.filter(b => b.critique === 'done' && b.vote === 'pending')

  if (ready.length === 0) {
    log.info('All votes already done, skipping')
    return
  }

  log.info(`${ready.length} LPs to arbitrate`)

  await runInBatches(ready, state.config.maxParallel, async (briefState) => {
    const brief = BRIEFS.find(b => b.id === briefState.id)!
    log.agent(brief.id, 'Arbitrating...')

    try {
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        BATCH_DIR: runDir,
      })
      await runClaude(prompt, agentLabel(state, `Brief ${brief.id}`))
      briefState.vote = 'done'
      log.agent(brief.id, `${c.green}Consensus reached${c.reset}`)
    }
    catch (err) {
      briefState.vote = 'error'
      state.errors.push({ phase: 'vote', briefId: brief.id, error: errorMessage(err) })
      log.agent(brief.id, `${c.red}Failed${c.reset}`)
    }

    await saveState(state, runDir)
  })

  state.phase = 'vote'
  await saveState(state, runDir)
}

async function phaseHumanReview(state: State, runDir: string, skipReview: boolean): Promise<void> {
  log.phase('PHASE 3.5 — HUMAN REVIEW')
  const pending = state.briefs.filter(b => b.vote === 'done' && b.humanReview === 'pending')

  if (pending.length === 0) {
    log.info('All human reviews already done, skipping')
    return
  }

  if (skipReview) {
    log.warn(`Skipping human review for ${pending.length} LPs (--skip-review)`)
    for (const b of pending)
      b.humanReview = 'skipped'
    await saveState(state, runDir)
    return
  }

  // Check if all have human-review files already
  const allReviewed = await Promise.all(
    pending.map(b => fileExists(resolve(runDir, `human-review/${b.id}.json`))),
  )
  if (allReviewed.every(Boolean)) {
    log.info('All human review files found, continuing')
    for (const b of pending)
      b.humanReview = 'done'
    await saveState(state, runDir)
    return
  }

  log.warn(`${pending.length} LP en attente de review humaine`)
  log.info(`→ Ouvrir ${BASE_URL}/batch/review`)
  log.info(`→ Puis relancer : yarn batch-lp run --resume-from revision`)
  state.phase = 'humanReview'
  await saveState(state, runDir)
  process.exit(0)
}

async function phaseRevision(state: State, token: string, runDir: string): Promise<void> {
  log.phase('PHASE 4 — REVISION')
  const template = await loadPromptTemplate('revisor')
  const ready = state.briefs.filter(b => b.vote === 'done' && b.revision === 'pending')

  if (ready.length === 0) {
    log.info('All revisions already done, skipping')
    return
  }

  log.info(`${ready.length} LPs to revise`)

  await runInBatches(ready, state.config.maxParallel, async (briefState) => {
    const brief = BRIEFS.find(b => b.id === briefState.id)!
    const creativeSeed = getCreativeSeed(brief.id)
    log.agent(brief.id, `Revising [${creativeSeed.styleProfile}]...`)

    try {
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        SLUG: brief.slug,
        CONTENT_ID: briefState.contentId ?? 0,
        ACCESS_TOKEN: token,
        BATCH_DIR: runDir,
        ...formatCreativeSeedVars(creativeSeed),
      })

      const output = await runClaude(prompt, agentLabel(state, `Brief ${brief.id}`))

      const feedback = parseFeedback(output)
      if (feedback) {
        await writeFile(
          resolve(runDir, `feedback/revision-${brief.id}.json`),
          JSON.stringify(feedback, null, 2),
        )
      }

      briefState.revision = 'done'
      log.agent(brief.id, `${c.green}Revised${c.reset}`)
    }
    catch (err) {
      briefState.revision = 'error'
      state.errors.push({ phase: 'revision', briefId: brief.id, error: errorMessage(err) })
      log.agent(brief.id, `${c.red}Failed${c.reset}`)
    }

    await saveState(state, runDir)
  })

  state.phase = 'revision'
  await saveState(state, runDir)
}

async function phaseBeautification(state: State, token: string, runDir: string): Promise<void> {
  log.phase('PHASE 4.5 — BEAUTIFICATION')

  // Create beautification directory
  await mkdir(resolve(runDir, 'beautification'), { recursive: true })

  const template = await loadPromptTemplate('beautifier')
  const ready = state.briefs.filter(b => b.revision === 'done' && b.beautification === 'pending')

  if (ready.length === 0) {
    log.info('All beautifications already done, skipping')
    return
  }

  log.info(`${ready.length} LPs to beautify`)

  await runInBatches(ready, state.config.maxParallel, async (briefState) => {
    const brief = BRIEFS.find(b => b.id === briefState.id)!
    const creativeSeed = getCreativeSeed(brief.id)
    log.agent(brief.id, `Beautifying [${creativeSeed.styleProfile}]...`)

    try {
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        SLUG: brief.slug,
        SECTOR: brief.sector,
        CONTENT_ID: briefState.contentId ?? 0,
        ACCESS_TOKEN: token,
        BATCH_DIR: runDir,
        ...formatCreativeSeedVars(creativeSeed),
      })

      const output = await runClaude(prompt, agentLabel(state, `Brief ${brief.id}`))

      // Validate beautified file exists
      const beautifiedPath = resolve(runDir, `lp-${brief.id}-beautified.json`)
      if (!await fileExists(beautifiedPath)) {
        // Fallback: copy revised to beautified
        const revisedPath = resolve(runDir, `lp-${brief.id}-revised.json`)
        const sourcePath = await fileExists(revisedPath)
          ? revisedPath
          : resolve(runDir, `lp-${brief.id}.json`)
        if (await fileExists(sourcePath)) {
          const content = await readFile(sourcePath, 'utf8')
          await writeFile(beautifiedPath, content)
          log.agent(brief.id, `${c.yellow}No beautified output, using source${c.reset}`)
        }
        else {
          throw new Error('No source design found for beautification')
        }
      }

      // Validate design tokens
      const beautified = JSON.parse(await readFile(beautifiedPath, 'utf8'))
      const tokenResult = validateDesignTokens(beautified.widgets || [])
      const pct = (tokenResult.complianceRate * 100).toFixed(0)

      if (tokenResult.valid) {
        log.agent(brief.id, `${c.green}Beautified (100% token compliant)${c.reset}`)
      }
      else {
        log.agent(brief.id, `${c.yellow}Beautified (${pct}% compliant, ${tokenResult.violations.length} violations)${c.reset}`)
      }

      // Parse feedback
      const feedback = parseFeedback(output)
      if (feedback) {
        await writeFile(
          resolve(runDir, `feedback/beautification-${brief.id}.json`),
          JSON.stringify(feedback, null, 2),
        )
      }

      briefState.beautification = 'done'
    }
    catch (err) {
      briefState.beautification = 'error'
      state.errors.push({ phase: 'beautification', briefId: brief.id, error: errorMessage(err) })
      log.agent(brief.id, `${c.red}Failed: ${errorMessage(err)}${c.reset}`)

      // Fallback: copy revised to beautified to continue pipeline
      const revisedPath = resolve(runDir, `lp-${brief.id}-revised.json`)
      const beautifiedPath = resolve(runDir, `lp-${brief.id}-beautified.json`)
      const sourcePath = await fileExists(revisedPath)
        ? revisedPath
        : resolve(runDir, `lp-${brief.id}.json`)
      if (await fileExists(sourcePath)) {
        const content = await readFile(sourcePath, 'utf8')
        await writeFile(beautifiedPath, content)
        log.agent(brief.id, `${c.yellow}Fallback: using source design${c.reset}`)
      }
    }

    await saveState(state, runDir)
  })

  state.phase = 'beautification'
  await saveState(state, runDir)
}

async function phaseReCritique(state: State, runDir: string): Promise<void> {
  log.phase('PHASE 4.6 — RE-CRITIQUE (UI)')

  const ready = state.briefs.filter(b => b.beautification === 'done' && b.reCritique === 'pending')

  if (ready.length === 0) {
    log.info('All re-critiques already done, skipping')
    return
  }

  log.info(`${ready.length} beautified LPs to re-evaluate`)

  const template = await loadPromptTemplate('critic-ui')

  await runInBatches(ready, state.config.maxParallel, async (briefState) => {
    const brief = BRIEFS.find(b => b.id === briefState.id)!
    log.agent(brief.id, 'Re-critiquing UI...')

    try {
      // Use beautified design for re-critique
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        SECTOR: brief.sector,
        SLUG: `${brief.slug}-beautified`,
        BRIEF_TEXT: brief.prompt,
        BATCH_DIR: runDir,
      })

      await runClaude(prompt, agentLabel(state, `B${brief.id} re-ui`))

      // Rename output to distinguish from original critique
      const originalCritique = resolve(runDir, `critiques/${brief.id}-ui.json`)
      const reCritiquePath = resolve(runDir, `critiques/${brief.id}-ui-post.json`)

      // Read new critique and compare scores
      if (await fileExists(originalCritique)) {
        const original = JSON.parse(await readFile(originalCritique, 'utf8'))
        // The new critique overwrites, so we need to read before it's overwritten
        // Actually, critic-ui writes to {id}-ui.json, so we should save original first
        const backupPath = resolve(runDir, `critiques/${brief.id}-ui-pre.json`)
        if (!await fileExists(backupPath)) {
          await writeFile(backupPath, JSON.stringify(original, null, 2))
        }
      }

      // Read the new critique (which was just written to {id}-ui.json)
      if (await fileExists(originalCritique)) {
        const newCritique = JSON.parse(await readFile(originalCritique, 'utf8'))
        // Copy to post file
        await writeFile(reCritiquePath, JSON.stringify(newCritique, null, 2))

        // Compare scores
        const prePath = resolve(runDir, `critiques/${brief.id}-ui-pre.json`)
        if (await fileExists(prePath)) {
          const preCritique = JSON.parse(await readFile(prePath, 'utf8'))
          const delta = (newCritique.averageScore || 0) - (preCritique.averageScore || 0)
          const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
          const color = delta > 0 ? c.green : delta < 0 ? c.red : c.gray
          log.agent(brief.id, `UI score: ${preCritique.averageScore?.toFixed(1)} → ${newCritique.averageScore?.toFixed(1)} (${color}${deltaStr}${c.reset})`)
        }
      }

      briefState.reCritique = 'done'
      log.agent(brief.id, `${c.green}Re-critique done${c.reset}`)
    }
    catch (err) {
      briefState.reCritique = 'error'
      state.errors.push({ phase: 'reCritique', briefId: brief.id, error: errorMessage(err) })
      log.agent(brief.id, `${c.red}Failed${c.reset}`)
    }

    await saveState(state, runDir)
  })

  state.phase = 'reCritique'
  await saveState(state, runDir)
}

async function phaseSynthesis(state: State, runDir: string): Promise<void> {
  log.phase('PHASE 5 — SYNTHESIS')
  const template = await loadPromptTemplate('synthesizer')

  try {
    const prompt = fillTemplate(template, { BATCH_DIR: runDir })
    await runClaude(prompt)
    log.success(`Synthesis report written to ${runDir}/synthesis.md`)
  }
  catch (err) {
    state.errors.push({ phase: 'synthesis', briefId: 0, error: errorMessage(err) })
    log.error(`Synthesis failed: ${errorMessage(err)}`)
  }

  state.phase = 'synthesis'
  await saveState(state, runDir)
}

async function phaseMetaAnalysis(state: State, runDir: string): Promise<void> {
  log.phase('PHASE 6 — META-ANALYSIS')
  const template = await loadPromptTemplate('meta-analyzer')

  try {
    const prompt = fillTemplate(template, { BATCH_DIR: runDir })
    await runClaude(prompt)
    log.success(`Meta-analysis written to ${runDir}/meta-analysis.md`)
  }
  catch (err) {
    state.errors.push({ phase: 'meta', briefId: 0, error: errorMessage(err) })
    log.error(`Meta-analysis failed: ${errorMessage(err)}`)
  }

  state.phase = 'done'
  await saveState(state, runDir)
}

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------

function printReport(state: State, runDir: string): void {
  log.phase('FINAL REPORT')
  log.info(`Run #${state.runId} — ${runDir}`)

  console.log(`${c.bold}  #  | Sector                  | Gen  | Crit | Vote | Rev  | Beaut | ReCrit${c.reset}`)
  console.log('  ---|-------------------------|------|------|------|------|-------|-------')

  const statusDisplay: Record<string, string> = {
    done: `${c.green}done${c.reset}`,
    error: `${c.red}err ${c.reset}`,
    skipped: `${c.yellow}skip${c.reset}`,
  }
  const status = (s: string) => statusDisplay[s] || `${c.gray}wait${c.reset}`

  for (const b of state.briefs) {
    const id = String(b.id).padStart(2)
    const sector = b.sector.padEnd(23)
    console.log(`  ${id} | ${sector} | ${status(b.generation)} | ${status(b.critique)} | ${status(b.vote)} | ${status(b.revision)} | ${status(b.beautification)} | ${status(b.reCritique)}`)
  }

  // Show beautification score deltas if available
  const beautifiedBriefs = state.briefs.filter(b => b.reCritique === 'done')
  if (beautifiedBriefs.length > 0) {
    console.log(`\n${c.bold}Beautification Impact:${c.reset}`)
    console.log(`  ${c.gray}(Run 'yarn batch-lp report' for detailed scores)${c.reset}`)
  }

  if (state.errors.length > 0) {
    console.log(`\n${c.red}${c.bold}Errors (${state.errors.length}):${c.reset}`)
    for (const e of state.errors) {
      console.log(`  ${c.red}[${e.phase}] Brief ${e.briefId}: ${e.error.slice(0, 100)}${c.reset}`)
    }
    const failedIds = [...new Set(state.errors.map(e => e.briefId))].filter(id => id > 0)
    if (failedIds.length > 0) {
      console.log(`\n  Retry failed briefs: ${c.cyan}yarn batch-lp run --briefs ${failedIds.join(',')}${c.reset}`)
    }
  }

  const doneCount = state.briefs.filter(b => b.beautification === 'done').length
  console.log(`\n${c.bold}Total: ${doneCount}/${state.briefs.length} LPs beautified${c.reset}`)
  console.log(`\nReports:`)
  console.log(`  ${c.cyan}${runDir}/synthesis.md${c.reset} — Widget feedback aggregation`)
  console.log(`  ${c.cyan}${runDir}/meta-analysis.md${c.reset} — System improvement recommendations`)
  console.log(`  ${c.cyan}${runDir}/beautification/${c.reset} — Beautification analysis & evaluations`)
  console.log(`\nNext step: ${c.cyan}/optimize-lp-pipeline${c.reset} to apply improvements`)
}

// ---------------------------------------------------------------------------
// Helpers: resolve run directory for CLI commands
// ---------------------------------------------------------------------------

async function loadBriefsFromRun(runDir: string): Promise<void> {
  const briefsFile = resolve(runDir, 'briefs.json')
  if (await fileExists(briefsFile)) {
    BRIEFS = JSON.parse(await readFile(briefsFile, 'utf8'))
  }
}

async function resolveRunDir(runArg?: string): Promise<{ runDir: string, state: State } | null> {
  let runDir: string
  if (runArg) {
    runDir = getRunDir(Number(runArg))
    const state = await loadState(runDir)
    if (!state) {
      log.error(`No state found for run #${runArg}`)
      return null
    }
    await loadBriefsFromRun(runDir)
    return { runDir, state }
  }
  const latestDir = await getLatestRunDir()
  if (!latestDir) {
    log.error('No batch in progress. Run: yarn batch-lp run')
    return null
  }
  runDir = latestDir
  const state = await loadState(runDir)
  if (!state)
    return null
  await loadBriefsFromRun(runDir)
  return { runDir, state }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const PHASES = ['briefs', 'generation', 'critique', 'vote', 'humanReview', 'revision', 'beautification', 'reCritique', 'synthesis', 'meta'] as const

const run = defineCommand({
  meta: { name: 'run', description: 'Run the batch LP generation pipeline' },
  args: {
    'max-parallel': { type: 'string', default: '5', description: 'Max concurrent agents' },
    'resume-from': { type: 'string', default: '', description: 'Resume from phase' },
    'skip-review': { type: 'boolean', default: false, description: 'Skip human review phase' },
    'briefs': { type: 'string', default: '', description: 'Comma-separated brief IDs' },
  },
  async run({ args }) {
    const maxParallel = Number.parseInt(args['max-parallel'] as string) || 5
    const skipReview = Boolean(args['skip-review'])
    const resumeFrom = (args['resume-from'] as string) || ''
    const briefIds = (args.briefs as string)
      ? (args.briefs as string).split(',').map(Number).filter(Boolean)
      : []

    log.phase('BATCH LP GENERATION PIPELINE')
    log.info(`Max parallel: ${maxParallel}`)
    if (briefIds.length > 0)
      log.info(`Briefs: ${briefIds.join(', ')}`)
    if (resumeFrom)
      log.info(`Resuming from: ${resumeFrom}`)

    // Determine run directory
    let runDir: string
    let state: State

    if (resumeFrom) {
      // Resume: use latest run
      const latestDir = await getLatestRunDir()
      if (!latestDir) {
        log.error('No existing run to resume. Run without --resume-from first.')
        process.exit(1)
      }
      runDir = latestDir
      // Load briefs.json from existing run
      await phaseBriefGeneration(runDir, briefIds)
      state = (await loadState(runDir))!
      state.config.maxParallel = maxParallel
      log.info(`Resuming run #${state.runId} from ${runDir}`)
    }
    else {
      // New run
      const runId = await getNextRunId()
      runDir = getRunDir(runId)
      await mkdir(runDir, { recursive: true })
      await updateLatestSymlink(runId)
      // Generate briefs via Claude agent
      await phaseBriefGeneration(runDir, briefIds)
      state = initState(maxParallel, briefIds)
      state.runId = runId
      await saveState(state, runDir)
      log.info(`New run #${runId} in ${runDir}`)
    }

    // Pre-flight — returns auth token
    const token = await preflight(runDir)
    if (!token) {
      process.exit(1)
    }

    // Determine starting phase (skip 'briefs' — already done above)
    const startIdx = resumeFrom
      ? PHASES.indexOf(resumeFrom as typeof PHASES[number])
      : 1 // skip briefs phase (index 0), already executed
    if (startIdx < 0) {
      log.error(`Unknown phase: ${resumeFrom}. Valid: ${PHASES.join(', ')}`)
      process.exit(1)
    }

    // Run phases sequentially
    const phaseFns = [
      () => phaseBriefGeneration(runDir, briefIds), // briefs (index 0)
      () => phaseGeneration(state, token, runDir),
      () => phaseCritique(state, runDir),
      () => phaseVote(state, runDir),
      () => phaseHumanReview(state, runDir, skipReview),
      () => phaseRevision(state, token, runDir),
      () => phaseBeautification(state, token, runDir),
      () => phaseReCritique(state, runDir),
      () => phaseSynthesis(state, runDir),
      () => phaseMetaAnalysis(state, runDir),
    ]

    for (let i = startIdx; i < phaseFns.length; i++) {
      await phaseFns[i]()
    }

    printReport(state, runDir)
    process.exit(0)
  },
})

const status = defineCommand({
  meta: { name: 'status', description: 'Show current pipeline state' },
  args: {
    run: { type: 'string', default: '', description: 'Specific run ID (default: latest)' },
  },
  async run({ args }) {
    const result = await resolveRunDir((args.run as string) || undefined)
    if (!result)
      return
    log.info(`Run #${result.state.runId} — Phase: ${result.state.phase}`)
    printReport(result.state, result.runDir)
  },
})

const report = defineCommand({
  meta: { name: 'report', description: 'Show final report' },
  args: {
    run: { type: 'string', default: '', description: 'Specific run ID (default: latest)' },
  },
  async run({ args }) {
    const result = await resolveRunDir((args.run as string) || undefined)
    if (!result)
      return
    printReport(result.state, result.runDir)

    // Show synthesis if available
    const synthPath = resolve(result.runDir, 'synthesis.md')
    if (await fileExists(synthPath)) {
      console.log(`\n${c.bold}Synthesis:${c.reset}`)
      const content = await readFile(synthPath, 'utf8')
      console.log(content.slice(0, 2000))
    }
  },
})

const calibrate = defineCommand({
  meta: { name: 'calibrate', description: 'Test critic calibration on a few briefs' },
  args: {
    briefs: { type: 'string', default: '', description: 'Brief IDs to test (default: 3 random generated)' },
    run: { type: 'string', default: '', description: 'Run ID (default: latest)' },
  },
  async run({ args }) {
    const result = await resolveRunDir((args.run as string) || undefined)
    if (!result)
      return

    const { runDir, state } = result
    const generated = state.briefs.filter(b => b.generation === 'done')

    if (generated.length === 0) {
      log.error('No generated LPs in this run. Run generation first.')
      return
    }

    // Pick briefs
    let selected: BriefState[]
    const briefArg = args.briefs as string
    if (briefArg) {
      const ids = briefArg.split(',').map(Number)
      selected = generated.filter(b => ids.includes(b.id))
      if (selected.length === 0) {
        log.error(`None of briefs ${briefArg} are generated. Available: ${generated.map(b => b.id).join(', ')}`)
        return
      }
    }
    else {
      // Random 3 (or less if fewer available)
      const shuffled = [...generated].sort(() => Math.random() - 0.5)
      selected = shuffled.slice(0, Math.min(3, shuffled.length))
    }

    log.phase('CALIBRATION TEST')
    log.info(`Testing ${selected.length} briefs: ${selected.map(b => `#${b.id} (${b.sector})`).join(', ')}`)

    // Reset critique/vote for selected briefs & delete old files
    for (const b of selected) {
      b.critique = 'pending'
      b.vote = 'pending'
      for (const role of ['marketing', 'ux', 'brand', 'ui']) {
        try {
          await unlink(resolve(runDir, `critiques/${b.id}-${role}.json`))
        }
        catch {}
      }
      try {
        await unlink(resolve(runDir, `votes/${b.id}-consensus.json`))
      }
      catch {}
    }
    await saveState(state, runDir)

    // Run critique + vote on selected briefs only
    // Temporarily replace state.briefs to scope the phases
    const originalBriefs = state.briefs
    state.briefs = selected
    await phaseCritique(state, runDir)
    await phaseVote(state, runDir)
    state.briefs = originalBriefs

    // Restore selected brief states in original array
    for (const s of selected) {
      const orig = originalBriefs.find(b => b.id === s.id)!
      orig.critique = s.critique
      orig.vote = s.vote
    }
    await saveState(state, runDir)

    // Read consensus files and print calibration report
    log.phase('CALIBRATION RESULTS')

    let totalScore = 0
    let totalCriteria = 0
    let highScores = 0
    let lowScores = 0

    for (const b of selected) {
      const consensusPath = resolve(runDir, `votes/${b.id}-consensus.json`)
      if (!await fileExists(consensusPath)) {
        log.error(`No consensus for brief #${b.id}`)
        continue
      }

      const consensus = JSON.parse(await readFile(consensusPath, 'utf8'))

      console.log(`\n  ${c.bold}Brief #${b.id} — ${b.sector}${c.reset}`)

      // Read individual critique files for detailed scores
      for (const role of ['marketing', 'ux', 'brand', 'ui'] as const) {
        const critiquePath = resolve(runDir, `critiques/${b.id}-${role}.json`)
        if (!await fileExists(critiquePath))
          continue

        const critique = JSON.parse(await readFile(critiquePath, 'utf8'))
        const avg = critique.averageScore || 0
        const scoreValues = Object.values(critique.scores || {}) as number[]

        for (const v of scoreValues) {
          totalCriteria++
          totalScore += v
          if (v >= 8)
            highScores++
          if (v <= 3)
            lowScores++
        }

        const color = avg <= 4 ? c.red : avg <= 6.5 ? c.yellow : c.green
        console.log(`    ${role.padEnd(10)} ${color}${avg.toFixed(1)}${c.reset}  |  scores: ${scoreValues.join(', ')}`)
      }

      const overall = consensus.overallScore || 0
      console.log(`    ${c.bold}Overall:   ${overall.toFixed(1)}${c.reset}`)
    }

    const avg = totalCriteria > 0 ? totalScore / totalCriteria : 0
    const highPct = totalCriteria > 0 ? (highScores / totalCriteria * 100) : 0
    const lowPct = totalCriteria > 0 ? (lowScores / totalCriteria * 100) : 0

    console.log(`\n  ${'─'.repeat(52)}`)
    console.log(`  ${c.bold}Overall average: ${avg.toFixed(1)} / 10${c.reset}`)
    console.log(`  Target range:    4.5 — 6.5  ${avg >= 4.5 && avg <= 6.5 ? `${c.green}✓ OK${c.reset}` : `${c.red}✗ OUT OF RANGE${c.reset}`}`)
    console.log(`  Scores 8+:  ${highScores}/${totalCriteria} (${highPct.toFixed(1)}%)  — target < 10%  ${highPct < 10 ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`}`)
    console.log(`  Scores ≤3:  ${lowScores}/${totalCriteria} (${lowPct.toFixed(1)}%)  — target ~5%    ${lowPct <= 10 ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`}`)
  },
})

const main = defineCommand({
  meta: { name: 'batch-lp', version: '1.0.0', description: 'Multi-agent batch LP generation pipeline' },
  subCommands: { run, status, report, calibrate },
})

runMain(main)
