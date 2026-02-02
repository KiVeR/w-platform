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
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineCommand, runMain } from 'citty'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:5174'
const AUTH_EMAIL = 'admin@test.com'
const AUTH_PASSWORD = 'Admin123!'
const BATCH_DIR = resolve('.claude/batch')
const PROMPTS_DIR = resolve('.claude/prompts/batch')
const STATE_FILE = resolve(BATCH_DIR, 'state.json')
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

async function loadState(): Promise<State | null> {
  if (!await fileExists(STATE_FILE))
    return null
  return JSON.parse(await readFile(STATE_FILE, 'utf8'))
}

async function saveState(state: State): Promise<void> {
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
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

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const chunks: string[] = []
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      chunks.push(text)
      process.stdout.write(`${c.gray}${text}${c.reset}`)
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude agent failed (exit ${code}):\n${stderr}`))
      }
      else {
        resolve(chunks.join(''))
      }
    })

    child.on('error', (err) => {
      reject(new Error(`Claude agent spawn failed: ${err.message}`))
    })

    // Send prompt via stdin and close
    child.stdin.write(prompt)
    child.stdin.end()

    // Timeout
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

async function preflight(): Promise<boolean> {
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

  // Check auth
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    })
    const data = await res.json() as { accessToken?: string }
    if (!data.accessToken)
      throw new Error('no token')
    log.success('Authentication OK')
  }
  catch {
    log.error('Authentication failed. Check credentials.')
    return false
  }

  // Create directories
  await mkdir(resolve(BATCH_DIR, 'critiques'), { recursive: true })
  await mkdir(resolve(BATCH_DIR, 'votes'), { recursive: true })
  await mkdir(resolve(BATCH_DIR, 'screenshots'), { recursive: true })
  await mkdir(resolve(BATCH_DIR, 'feedback'), { recursive: true })
  log.success('Directories created')

  return true
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

async function phaseGeneration(state: State): Promise<void> {
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
      })

      const output = await runClaude(prompt)

      // Parse feedback from output
      const feedback = parseFeedback(output)
      if (feedback) {
        await writeFile(
          resolve(BATCH_DIR, `feedback/generation-${brief.id}.json`),
          JSON.stringify(feedback, null, 2),
        )
        if (typeof (feedback as Record<string, unknown>).contentId === 'number') {
          briefState.contentId = (feedback as Record<string, unknown>).contentId as number
        }
        if (typeof (feedback as Record<string, unknown>).title === 'string') {
          briefState.title = (feedback as Record<string, unknown>).title as string
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
    await saveState(state)
  })
}

async function phaseCritique(state: State): Promise<void> {
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
      })

      await runClaude(prompt)
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
      ['marketing', 'ux', 'brand'].map(r => fileExists(resolve(BATCH_DIR, `critiques/${b.id}-${r}.json`))),
    )
    b.critique = allDone.every(Boolean) ? 'done' : 'error'
  }

  state.phase = 'critique'
  await saveState(state)
}

async function phaseVote(state: State): Promise<void> {
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
      const prompt = fillTemplate(template, { BRIEF_ID: brief.id })
      await runClaude(prompt)
      briefState.vote = 'done'
      log.agent(brief.id, `${c.green}Consensus reached${c.reset}`)
    }
    catch (err) {
      briefState.vote = 'error'
      state.errors.push({ phase: 'vote', briefId: brief.id, error: (err as Error).message })
      log.agent(brief.id, `${c.red}Failed${c.reset}`)
    }

    await saveState(state)
  })

  state.phase = 'vote'
  await saveState(state)
}

async function phaseRevision(state: State): Promise<void> {
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
      })

      const output = await runClaude(prompt)

      const feedback = parseFeedback(output)
      if (feedback) {
        await writeFile(
          resolve(BATCH_DIR, `feedback/revision-${brief.id}.json`),
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

    await saveState(state)
  })

  state.phase = 'revision'
  await saveState(state)
}

async function phaseSynthesis(state: State): Promise<void> {
  log.phase('PHASE 5 — SYNTHESIS')
  const template = await loadPromptTemplate('synthesizer')

  try {
    await runClaude(template)
    log.success('Synthesis report written to .claude/batch/synthesis.md')
  }
  catch (err) {
    state.errors.push({ phase: 'synthesis', briefId: 0, error: (err as Error).message })
    log.error(`Synthesis failed: ${(err as Error).message}`)
  }

  state.phase = 'synthesis'
  await saveState(state)
}

async function phaseMetaAnalysis(state: State): Promise<void> {
  log.phase('PHASE 6 — META-ANALYSIS')
  const template = await loadPromptTemplate('meta-analyzer')

  try {
    await runClaude(template)
    log.success('Meta-analysis written to .claude/batch/meta-analysis.md')
  }
  catch (err) {
    state.errors.push({ phase: 'meta', briefId: 0, error: (err as Error).message })
    log.error(`Meta-analysis failed: ${(err as Error).message}`)
  }

  state.phase = 'done'
  await saveState(state)
}

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------

function printReport(state: State): void {
  log.phase('FINAL REPORT')

  console.log(`${c.bold}  #  | Sector                  | Status Gen | Critique | Vote | Revision${c.reset}`)
  console.log('  ---|-------------------------|------------|----------|------|----------')

  for (const b of state.briefs) {
    const status = (s: string) => {
      if (s === 'done')
        return `${c.green}done${c.reset}`
      if (s === 'error')
        return `${c.red}err ${c.reset}`
      return `${c.gray}skip${c.reset}`
    }
    const id = String(b.id).padStart(2)
    const sector = b.sector.padEnd(23)
    console.log(`  ${id} | ${sector} | ${status(b.generation)}       | ${status(b.critique)}     | ${status(b.vote)} | ${status(b.revision)}`)
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
  console.log(`  ${c.cyan}.claude/batch/synthesis.md${c.reset} — Widget feedback aggregation`)
  console.log(`  ${c.cyan}.claude/batch/meta-analysis.md${c.reset} — System improvement recommendations`)
  console.log(`\nNext step: ${c.cyan}/optimize-lp-pipeline${c.reset} to apply improvements`)
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const PHASES = ['generation', 'critique', 'vote', 'revision', 'synthesis', 'meta'] as const

const run = defineCommand({
  meta: { name: 'run', description: 'Run the batch LP generation pipeline' },
  args: {
    'max-parallel': { type: 'string', default: '5', description: 'Max concurrent agents' },
    'resume-from': { type: 'string', default: '', description: 'Resume from phase' },
    'briefs': { type: 'string', default: '', description: 'Comma-separated brief IDs' },
  },
  async run({ args }) {
    const maxParallel = Number.parseInt(args['max-parallel'] as string) || 5
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

    // Pre-flight
    if (!await preflight()) {
      process.exit(1)
    }

    // Load or create state
    let state: State
    if (resumeFrom && await fileExists(STATE_FILE)) {
      state = (await loadState())!
      state.config.maxParallel = maxParallel
      log.info(`Loaded existing state (run #${state.runId})`)
    }
    else {
      state = initState(maxParallel, briefIds)
      await saveState(state)
      log.info('Initialized new state')
    }

    // Determine starting phase
    const startIdx = resumeFrom ? PHASES.indexOf(resumeFrom as typeof PHASES[number]) : 0
    if (startIdx < 0) {
      log.error(`Unknown phase: ${resumeFrom}. Valid: ${PHASES.join(', ')}`)
      process.exit(1)
    }

    // Run phases sequentially
    const phaseFns = [
      phaseGeneration,
      phaseCritique,
      phaseVote,
      phaseRevision,
      phaseSynthesis,
      phaseMetaAnalysis,
    ]

    for (let i = startIdx; i < phaseFns.length; i++) {
      await phaseFns[i](state)
    }

    printReport(state)
  },
})

const status = defineCommand({
  meta: { name: 'status', description: 'Show current pipeline state' },
  async run() {
    const state = await loadState()
    if (!state) {
      log.error('No batch in progress. Run: yarn batch-lp run')
      return
    }
    log.info(`Run #${state.runId} — Phase: ${state.phase}`)
    printReport(state)
  },
})

const report = defineCommand({
  meta: { name: 'report', description: 'Show final report' },
  async run() {
    const state = await loadState()
    if (!state) {
      log.error('No batch results. Run: yarn batch-lp run')
      return
    }
    printReport(state)

    // Show synthesis if available
    if (await fileExists(resolve(BATCH_DIR, 'synthesis.md'))) {
      console.log(`\n${c.bold}Synthesis:${c.reset}`)
      const content = await readFile(resolve(BATCH_DIR, 'synthesis.md'), 'utf8')
      console.log(content.slice(0, 2000))
    }
  },
})

const main = defineCommand({
  meta: { name: 'batch-lp', version: '1.0.0', description: 'Multi-agent batch LP generation pipeline' },
  subCommands: { run, status, report },
})

runMain(main)
