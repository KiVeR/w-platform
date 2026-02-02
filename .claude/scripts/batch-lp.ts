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
const CLAUDE_TIMEOUT = 10 * 60 * 1000 // 10 min per agent

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
// Briefs
// ---------------------------------------------------------------------------

const BRIEFS: Brief[] = [
  { id: 1, sector: 'restauration-rapide', slug: 'smash-house-burger', prompt: 'Restaurant de burgers artisanaux "Le Smash House". Promotion limitée : menu Burger Signature + frites maison + boisson à 12€ au lieu de 18€, valable jusqu\'au 28 février 2026. Ambiance street food moderne. CTA principal : Commander maintenant (bouton vers menu). CTA secondaire : Réserver une table (click-to-call). Inclure photo hero du burger, section ingrédients frais, horaires d\'ouverture.' },
  { id: 2, sector: 'banque-assurance', slug: 'banque-proximite-rdv', prompt: 'Agence Banque Proximité. Consultation patrimoniale gratuite et sans engagement avec un conseiller dédié. Mettre en avant : sécurité de l\'épargne, accompagnement personnalisé, 30 ans d\'expertise. CTA principal : formulaire de prise de RDV (nom, email, téléphone, créneau préféré). CTA secondaire : appeler l\'agence. Inclure carte de localisation de l\'agence. Ton rassurant et professionnel.' },
  { id: 3, sector: 'mode-pret-a-porter', slug: 'eclat-paris-vente-flash', prompt: 'Marque "Éclat Paris". Vente flash -50% sur toute la collection été 2026, 48h seulement. Ambiance élégante et exclusive. CTA : Découvrir la collection (bouton). Inclure galerie de 4+ looks phares, section "pourquoi Éclat" (qualité, made in France, livraison express). Urgence forte avec mention du temps restant. Ton luxueux mais accessible.' },
  { id: 4, sector: 'automobile', slug: 'ecomotion-volta-essai', prompt: 'Constructeur EcoMotion. Essai gratuit du nouveau SUV 100% électrique "Volta". Autonomie 600km, recharge rapide 20min. CTA principal : Réserver mon essai (formulaire avec nom, ville, date souhaitée). Vidéo de présentation du véhicule. Section caractéristiques techniques avec icônes. Ton moderne et technologique. Palette sombre (noir/vert électrique).' },
  { id: 5, sector: 'immobilier', slug: 'jardins-emeraude-portes-ouvertes', prompt: 'Résidence neuve "Les Jardins d\'Émeraude" à Nantes. Journée portes ouvertes le 15 mars 2026. Appartements T2 à T4 à partir de 185 000€. CTA : S\'inscrire aux portes ouvertes (formulaire). Section galerie avec vues des appartements et espaces communs. Plan de localisation avec carte. Ton chaleureux et familial. Palette verte/nature.' },
  { id: 6, sector: 'fitness', slug: 'fitclub-premier-mois', prompt: 'FitClub Premium. Offre de lancement : premier mois offert sans engagement. 50+ cours collectifs, coach personnel, espace bien-être. CTA principal : Je profite de l\'offre (bouton). Section slider des équipements. Icônes pour les avantages (parking, douches, sauna). Ton énergique et motivant. Palette orange/noir dynamique.' },
  { id: 7, sector: 'telecoms', slug: 'neomobile-forfait-5g', prompt: 'Opérateur NéoMobile. Nouveau forfait 5G illimité à 19,99€/mois sans engagement (au lieu de 34,99€). Appels, SMS, data illimités en France + 50Go en Europe. CTA : Souscrire maintenant (bouton). Comparatif avec la concurrence via icônes. Simple, direct, sans blabla. Palette bleue/blanche épurée.' },
  { id: 8, sector: 'cosmetique-beaute', slug: 'maison-lumiere-serum', prompt: 'Maison Lumière. Recevez gratuitement un échantillon du nouveau sérum anti-âge "Éclat Divin". Formulaire d\'inscription (nom, email, adresse, type de peau). Section ingrédients naturels avec icônes. Témoignage d\'une ambassadrice. Ton luxueux et sensoriel. Palette dorée/crème.' },
  { id: 9, sector: 'education-formation', slug: 'digilearn-webinaire-ia', prompt: 'Institut DigiLearn. Webinaire gratuit "L\'IA au service de votre carrière" le 20 mars 2026 à 19h. Intervenant : Dr. Sophie Martin, experte IA. CTA : S\'inscrire au webinaire (formulaire email + prénom). Programme en 3 points. Vidéo teaser de l\'intervenante. Ton sérieux et inspirant. Palette bleu marine/blanc.' },
  { id: 10, sector: 'voyage-tourisme', slug: 'odyssee-grece-earlybird', prompt: 'Agence Odyssée Voyages. Offre early-bird : séjour tout compris en Grèce (Santorin) 7 nuits, -30% pour toute réservation avant le 1er avril 2026. À partir de 890€/personne. CTA : Réserver mon séjour (bouton). Galerie photos de Santorin. Section inclus dans le séjour. Ton évasion et rêve. Palette bleu méditerranée/blanc.' },
  { id: 11, sector: 'sante-pharmacie', slug: 'pharmasante-vaccination', prompt: 'Réseau PharmaSanté. Campagne de vaccination grippe saisonnière. Sans RDV, dans vos pharmacies participantes. CTA : Trouver ma pharmacie (store-locator / carte). Section FAQ simplifiée. Icônes pour les publics concernés (seniors, femmes enceintes, professionnels de santé). Ton bienveillant et informatif. Palette bleu clair/blanc.' },
  { id: 12, sector: 'grande-distribution', slug: 'freshmarket-fidelite', prompt: 'Supermarchés FreshMarket. Nouveau programme de fidélité avec carte 100% dématérialisée. 1 point par euro dépensé, paliers de récompenses. CTA : Activer ma carte (formulaire email + téléphone). Section barcode pour scanner en caisse. Avantages avec icônes (réductions exclusives, anniversaire, accès prioritaire). Ton pratique et économique. Palette verte/jaune.' },
  { id: 13, sector: 'evenementiel', slug: 'nuits-sonores-festival', prompt: 'Festival "Nuits Sonores Lyon 2026". 4 jours de musique électronique, 80+ artistes, 5 scènes. Du 28 au 31 mai 2026. CTA : Acheter mon pass (bouton vers billetterie). Galerie artistes avec photos. Programme par jour. Liens réseaux sociaux. Ton festif et dynamique. Palette noir/violet/néon.' },
  { id: 14, sector: 'ong-association', slug: 'terre-vivante-dons', prompt: 'Association "Terre Vivante". Campagne de reforestation : 1 don = 1 arbre planté. Objectif : 100 000 arbres en 2026. CTA principal : Je plante un arbre (bouton don). Compteur d\'arbres plantés (simulé via texte). Section impact : chiffres clés avec icônes. Photo forte de la forêt. Ton engagé et émotionnel. Palette vert forêt/terre.' },
  { id: 15, sector: 'b2b-saas', slug: 'pipelinecrm-demo', prompt: 'PipelineCRM. Logiciel CRM tout-en-un pour PME. Démo gratuite de 30 min avec un expert. +35% de conversion en moyenne chez nos clients. CTA : Demander ma démo (formulaire nom, entreprise, email, taille équipe). Section 3 bénéfices avec icônes. Logo clients (simulés). Ton expert et orienté ROI. Palette bleu corporate/gris.' },
  { id: 16, sector: 'ecommerce-alimentaire', slug: 'freshbox-livraison', prompt: 'FreshBox. Livraison de courses à domicile. -15€ sur la première commande avec le code FRESH15. Livraison en 2h, produits frais garantis, 5000+ références. CTA : Commander maintenant (bouton). Section fonctionnement en 3 étapes avec icônes. Image hero panier de courses. Ton pratique et moderne. Palette verte/blanche.' },
  { id: 17, sector: 'luxe-horlogerie', slug: 'aether-watches-eternite', prompt: 'Maison Aether Watches. Découvrez la nouvelle collection "Éternité" : montres automatiques en édition limitée (500 exemplaires). CTA : Réserver ma visite privée (bouton). Vidéo du mécanisme. Image hero plein écran de la montre. Détails matériaux et savoir-faire. Ton prestige absolu. Palette noir/or. Minimaliste.' },
  { id: 18, sector: 'sport-club-pro', slug: 'olympique-lyon-abonnement', prompt: 'Olympique Club de Lyon. Abonnement saison 2026-2027 : accès à tous les matchs à domicile. Early-bird -20% avant le 30 avril 2026. CTA principal : Souscrire mon abonnement (bouton). Slider photos du stade et des joueurs. Section formules (Essentiel, Premium, VIP). CTA secondaire : Acheter un billet à l\'unité. Ton passionné et dynamique. Palette bleu/rouge du club.' },
  { id: 19, sector: 'collectivite', slug: 'mairie-carte-identite', prompt: 'Mairie de Villefranche. Demande de carte d\'identité en ligne : simplifiez vos démarches. Formulaire pré-inscription (nom, date de naissance, email, pièces à fournir). Section documents nécessaires avec icônes. Lien pour télécharger les formulaires (drive). Horaires du service et carte. Ton officiel mais accessible. Palette bleu/blanc/rouge.' },
  { id: 20, sector: 'jeu-concours', slug: 'snackfun-grattez-gagnez', prompt: 'Marque SnackFun. Grand jeu de l\'été : grattez et tentez de gagner ! Lot principal : voyage à Bali pour 2. + 1000 bons d\'achat de 50€. CTA : Tenter ma chance (scratch widget). Section lots à gagner avec images. Règlement du jeu. Effet confetti. Flipcard pour découvrir des indices. Ton fun et excitant. Palette jaune/rose/turquoise.' },
]

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

function parseFeedback(output: string): Record<string, unknown> | null {
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
  await mkdir(resolve(runDir, 'critiques'), { recursive: true })
  await mkdir(resolve(runDir, 'votes'), { recursive: true })
  await mkdir(resolve(runDir, 'screenshots'), { recursive: true })
  await mkdir(resolve(runDir, 'feedback'), { recursive: true })
  await mkdir(resolve(runDir, 'human-review'), { recursive: true })
  log.success(`Directories created in ${runDir}`)

  return token
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

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
    log.agent(brief.id, `Generating ${brief.sector}...`)

    try {
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        BRIEF_TEXT: brief.prompt,
        SLUG: brief.slug,
        LP_TITLE: brief.sector,
        ACCESS_TOKEN: token,
        BATCH_DIR: runDir,
      })

      const soloMode = state.config.maxParallel === 1
      const output = await runClaude(prompt, soloMode ? undefined : `Brief ${brief.id}`)

      // Parse feedback from output
      const feedback = parseFeedback(output)
      if (feedback) {
        await writeFile(
          resolve(runDir, `feedback/generation-${brief.id}.json`),
          JSON.stringify(feedback, null, 2),
        )
        if (typeof (feedback as Record<string, unknown>).contentId === 'number') {
          briefState.contentId = (feedback as Record<string, unknown>).contentId as number
        }
        if (typeof (feedback as Record<string, unknown>).title === 'string') {
          briefState.title = (feedback as Record<string, unknown>).title as string
        }
      }

      // Validate design tokens compliance
      const lpFile = resolve(runDir, `lp-${brief.id}.json`)
      if (await fileExists(lpFile)) {
        try {
          const design = JSON.parse(await readFile(lpFile, 'utf8'))
          const widgets = design.widgets || []
          const result = validateDesignTokens(widgets)
          const pct = (result.complianceRate * 100).toFixed(0)
          if (result.valid) {
            log.agent(brief.id, `${c.green}Design tokens: 100% compliant${c.reset}`)
          }
          else {
            log.agent(brief.id, `${c.yellow}Design tokens: ${pct}% compliant (${result.violations.length} violations)${c.reset}`)
            for (const v of result.violations.slice(0, 5)) {
              log.agent(brief.id, `  ${c.gray}${v.widgetId}.${v.property}: ${v.value} → ${v.nearestToken}${c.reset}`)
            }
          }
        }
        catch {
          // JSON parse error — skip validation
        }
      }

      briefState.generation = 'done'
      log.agent(brief.id, `${c.green}Done${c.reset}`)
    }
    catch (err) {
      briefState.generation = 'error'
      state.errors.push({ phase: 'generation', briefId: brief.id, error: (err as Error).message })
      log.agent(brief.id, `${c.red}Failed: ${(err as Error).message}${c.reset}`)
    }

    state.phase = 'generation'
    await saveState(state, runDir)
  })
}

async function phaseCritique(state: State, runDir: string): Promise<void> {
  log.phase('PHASE 2 — CRITIQUE')
  const roles = ['critic-marketing', 'critic-ux', 'critic-brand'] as const
  const generated = state.briefs.filter(b => b.generation === 'done' && b.critique === 'pending')

  if (generated.length === 0) {
    log.info('All critiques already done, skipping')
    return
  }

  log.info(`${generated.length} LPs to critique (×3 reviewers = ${generated.length * 3} agents)`)

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

      const soloMode = state.config.maxParallel === 1
      await runClaude(prompt, soloMode ? undefined : `B${brief.id} ${roleName}`)
      log.agent(brief.id, `${roleName} ${c.green}done${c.reset}`)
    }
    catch (err) {
      state.errors.push({ phase: 'critique', briefId: brief.id, error: `${role}: ${(err as Error).message}` })
      log.agent(brief.id, `${roleName} ${c.red}failed${c.reset}`)
    }
  })

  // Mark critique as done for briefs that have all 3 files
  for (const b of generated) {
    const allDone = await Promise.all(
      ['marketing', 'ux', 'brand'].map(r => fileExists(resolve(runDir, `critiques/${b.id}-${r}.json`))),
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
      const soloMode = state.config.maxParallel === 1
      await runClaude(prompt, soloMode ? undefined : `Brief ${brief.id}`)
      briefState.vote = 'done'
      log.agent(brief.id, `${c.green}Consensus reached${c.reset}`)
    }
    catch (err) {
      briefState.vote = 'error'
      state.errors.push({ phase: 'vote', briefId: brief.id, error: (err as Error).message })
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
    log.agent(brief.id, 'Revising...')

    try {
      const prompt = fillTemplate(template, {
        BRIEF_ID: brief.id,
        SLUG: brief.slug,
        CONTENT_ID: briefState.contentId ?? 0,
        ACCESS_TOKEN: token,
        BATCH_DIR: runDir,
      })

      const soloMode = state.config.maxParallel === 1
      const output = await runClaude(prompt, soloMode ? undefined : `Brief ${brief.id}`)

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
      state.errors.push({ phase: 'revision', briefId: brief.id, error: (err as Error).message })
      log.agent(brief.id, `${c.red}Failed${c.reset}`)
    }

    await saveState(state, runDir)
  })

  state.phase = 'revision'
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
    state.errors.push({ phase: 'synthesis', briefId: 0, error: (err as Error).message })
    log.error(`Synthesis failed: ${(err as Error).message}`)
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
    state.errors.push({ phase: 'meta', briefId: 0, error: (err as Error).message })
    log.error(`Meta-analysis failed: ${(err as Error).message}`)
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

  console.log(`${c.bold}  #  | Sector                  | Gen  | Crit | Vote | Review | Revision${c.reset}`)
  console.log('  ---|-------------------------|------|------|------|--------|----------')

  for (const b of state.briefs) {
    const status = (s: string) => {
      if (s === 'done')
        return `${c.green}done${c.reset}`
      if (s === 'error')
        return `${c.red}err ${c.reset}`
      if (s === 'skipped')
        return `${c.yellow}skip${c.reset}`
      return `${c.gray}wait${c.reset}`
    }
    const id = String(b.id).padStart(2)
    const sector = b.sector.padEnd(23)
    console.log(`  ${id} | ${sector} | ${status(b.generation)} | ${status(b.critique)} | ${status(b.vote)} | ${status(b.humanReview)} | ${status(b.revision)}`)
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

  const doneCount = state.briefs.filter(b => b.revision === 'done').length
  console.log(`\n${c.bold}Total: ${doneCount}/${state.briefs.length} LPs completed${c.reset}`)
  console.log(`\nReports:`)
  console.log(`  ${c.cyan}${runDir}/synthesis.md${c.reset} — Widget feedback aggregation`)
  console.log(`  ${c.cyan}${runDir}/meta-analysis.md${c.reset} — System improvement recommendations`)
  console.log(`\nNext step: ${c.cyan}/optimize-lp-pipeline${c.reset} to apply improvements`)
}

// ---------------------------------------------------------------------------
// Helpers: resolve run directory for CLI commands
// ---------------------------------------------------------------------------

async function resolveRunDir(runArg?: string): Promise<{ runDir: string, state: State } | null> {
  if (runArg) {
    const runDir = getRunDir(Number(runArg))
    const state = await loadState(runDir)
    if (!state) {
      log.error(`No state found for run #${runArg}`)
      return null
    }
    return { runDir, state }
  }
  const latestDir = await getLatestRunDir()
  if (!latestDir) {
    log.error('No batch in progress. Run: yarn batch-lp run')
    return null
  }
  const state = await loadState(latestDir)
  if (!state)
    return null
  return { runDir: latestDir, state }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const PHASES = ['generation', 'critique', 'vote', 'humanReview', 'revision', 'synthesis', 'meta'] as const

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
      state = (await loadState(runDir))!
      state.config.maxParallel = maxParallel
      log.info(`Resuming run #${state.runId} from ${runDir}`)
    }
    else {
      // New run
      const runId = await getNextRunId()
      runDir = getRunDir(runId)
      state = initState(maxParallel, briefIds)
      state.runId = runId
      await mkdir(runDir, { recursive: true })
      await saveState(state, runDir)
      await updateLatestSymlink(runId)
      log.info(`New run #${runId} in ${runDir}`)
    }

    // Pre-flight — returns auth token
    const token = await preflight(runDir)
    if (!token) {
      process.exit(1)
    }

    // Determine starting phase
    const startIdx = resumeFrom ? PHASES.indexOf(resumeFrom as typeof PHASES[number]) : 0
    if (startIdx < 0) {
      log.error(`Unknown phase: ${resumeFrom}. Valid: ${PHASES.join(', ')}`)
      process.exit(1)
    }

    // Run phases sequentially
    const phaseFns = [
      () => phaseGeneration(state, token, runDir),
      () => phaseCritique(state, runDir),
      () => phaseVote(state, runDir),
      () => phaseHumanReview(state, runDir, skipReview),
      () => phaseRevision(state, token, runDir),
      () => phaseSynthesis(state, runDir),
      () => phaseMetaAnalysis(state, runDir),
    ]

    for (let i = startIdx; i < phaseFns.length; i++) {
      await phaseFns[i]()
    }

    printReport(state, runDir)
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
      for (const role of ['marketing', 'ux', 'brand']) {
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
      for (const role of ['marketing', 'ux', 'brand'] as const) {
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
