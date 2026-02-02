You are orchestrating a multi-agent pipeline for batch landing page generation in Kreo. This command generates 20 landing pages with expert critique, consensus voting, revision, and product feedback synthesis.

Arguments (optional via $ARGUMENTS):
- `--max-parallel N` (default: 5) — Maximum concurrent agents per batch
- `--resume-from PHASE` — Resume from: generation|critique|vote|revision|synthesis|meta
- `--briefs 1,2,5` — Only process specific brief IDs (comma-separated)

---

## PRE-FLIGHT CHECKS

Before anything, perform these checks:

1. **Verify server**: Run `node -e "fetch('http://localhost:5174/api/v1/health').then(r=>r.ok?console.log('OK'):console.log('FAIL')).catch(()=>console.log('FAIL'))"` — if FAIL, tell the user to run `yarn dev` and stop.

2. **Verify auth**: Run:
```javascript
node -e "
fetch('http://localhost:5174/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'Admin123!' })
}).then(r => r.json()).then(d => console.log(d.accessToken ? 'AUTH_OK' : 'AUTH_FAIL')).catch(() => console.log('AUTH_FAIL'))
"
```
If AUTH_FAIL, stop and report.

3. **Create directories**: `mkdir -p .claude/batch/critiques .claude/batch/votes .claude/batch/screenshots`

4. **Initialize state**: If `.claude/batch/state.json` does not exist (or no `--resume-from`), create it:
```json
{
  "runId": 1,
  "phase": "generation",
  "config": { "maxParallel": 5 },
  "briefs": [],
  "errors": [],
  "startedAt": "<ISO date>"
}
```
If resuming, read the existing state and continue from the specified phase.

---

## THE 20 BRIEFS

Use these briefs. Each agent receives ONE brief with its full prompt.

```
BRIEF 1 — Restauration rapide
Restaurant de burgers artisanaux "Le Smash House". Promotion limitée : menu Burger Signature + frites maison + boisson à 12€ au lieu de 18€, valable jusqu'au 28 février 2026. Ambiance street food moderne. CTA principal : Commander maintenant (bouton vers menu). CTA secondaire : Réserver une table (click-to-call). Inclure photo hero du burger, section ingrédients frais, horaires d'ouverture.

BRIEF 2 — Banque / Assurance
Agence Banque Proximité. Consultation patrimoniale gratuite et sans engagement avec un conseiller dédié. Mettre en avant : sécurité de l'épargne, accompagnement personnalisé, 30 ans d'expertise. CTA principal : formulaire de prise de RDV (nom, email, téléphone, créneau préféré). CTA secondaire : appeler l'agence. Inclure carte de localisation de l'agence. Ton rassurant et professionnel.

BRIEF 3 — Mode / Prêt-à-porter
Marque "Éclat Paris". Vente flash -50% sur toute la collection été 2026, 48h seulement. Ambiance élégante et exclusive. CTA : Découvrir la collection (bouton). Inclure galerie de 4+ looks phares, section "pourquoi Éclat" (qualité, made in France, livraison express). Urgence forte avec mention du temps restant. Ton luxueux mais accessible.

BRIEF 4 — Automobile
Constructeur EcoMotion. Essai gratuit du nouveau SUV 100% électrique "Volta". Autonomie 600km, recharge rapide 20min. CTA principal : Réserver mon essai (formulaire avec nom, ville, date souhaitée). Vidéo de présentation du véhicule. Section caractéristiques techniques avec icônes. Ton moderne et technologique. Palette sombre (noir/vert électrique).

BRIEF 5 — Immobilier
Résidence neuve "Les Jardins d'Émeraude" à Nantes. Journée portes ouvertes le 15 mars 2026. Appartements T2 à T4 à partir de 185 000€. CTA : S'inscrire aux portes ouvertes (formulaire). Section galerie avec vues des appartements et espaces communs. Plan de localisation avec carte. Ton chaleureux et familial. Palette verte/nature.

BRIEF 6 — Fitness / Salle de sport
FitClub Premium. Offre de lancement : premier mois offert sans engagement. 50+ cours collectifs, coach personnel, espace bien-être. CTA principal : Je profite de l'offre (bouton). Section slider des équipements. Icônes pour les avantages (parking, douches, sauna). Ton énergique et motivant. Palette orange/noir dynamique.

BRIEF 7 — Télécoms
Opérateur NéoMobile. Nouveau forfait 5G illimité à 19,99€/mois sans engagement (au lieu de 34,99€). Appels, SMS, data illimités en France + 50Go en Europe. CTA : Souscrire maintenant (bouton). Comparatif avec la concurrence via icônes. Simple, direct, sans blabla. Palette bleue/blanche épurée.

BRIEF 8 — Cosmétique / Beauté
Maison Lumière. Recevez gratuitement un échantillon du nouveau sérum anti-âge "Éclat Divin". Formulaire d'inscription (nom, email, adresse, type de peau). Section ingrédients naturels avec icônes. Témoignage d'une ambassadrice. Ton luxueux et sensoriel. Palette dorée/crème.

BRIEF 9 — Éducation / Formation
Institut DigiLearn. Webinaire gratuit "L'IA au service de votre carrière" le 20 mars 2026 à 19h. Intervenant : Dr. Sophie Martin, experte IA. CTA : S'inscrire au webinaire (formulaire email + prénom). Programme en 3 points. Vidéo teaser de l'intervenante. Ton sérieux et inspirant. Palette bleu marine/blanc.

BRIEF 10 — Voyage / Tourisme
Agence Odyssée Voyages. Offre early-bird : séjour tout compris en Grèce (Santorin) 7 nuits, -30% pour toute réservation avant le 1er avril 2026. À partir de 890€/personne. CTA : Réserver mon séjour (bouton). Galerie photos de Santorin. Section inclus dans le séjour. Ton évasion et rêve. Palette bleu méditerranée/blanc.

BRIEF 11 — Santé / Pharmacie
Réseau PharmaSanté. Campagne de vaccination grippe saisonnière. Sans RDV, dans vos pharmacies participantes. CTA : Trouver ma pharmacie (store-locator / carte). Section FAQ simplifiée. Icônes pour les publics concernés (seniors, femmes enceintes, professionnels de santé). Ton bienveillant et informatif. Palette bleu clair/blanc.

BRIEF 12 — Grande distribution
Supermarchés FreshMarket. Nouveau programme de fidélité avec carte 100% dématérialisée. 1 point par euro dépensé, paliers de récompenses. CTA : Activer ma carte (formulaire email + téléphone). Section barcode pour scanner en caisse. Avantages avec icônes (réductions exclusives, anniversaire, accès prioritaire). Ton pratique et économique. Palette verte/jaune.

BRIEF 13 — Événementiel
Festival "Nuits Sonores Lyon 2026". 4 jours de musique électronique, 80+ artistes, 5 scènes. Du 28 au 31 mai 2026. CTA : Acheter mon pass (bouton vers billetterie). Galerie artistes avec photos. Programme par jour. Liens réseaux sociaux. Ton festif et dynamique. Palette noir/violet/néon.

BRIEF 14 — ONG / Association
Association "Terre Vivante". Campagne de reforestation : 1 don = 1 arbre planté. Objectif : 100 000 arbres en 2026. CTA principal : Je plante un arbre (bouton don). Compteur d'arbres plantés (simulé via texte). Section impact : chiffres clés avec icônes. Photo forte de la forêt. Ton engagé et émotionnel. Palette vert forêt/terre.

BRIEF 15 — B2B / SaaS
PipelineCRM. Logiciel CRM tout-en-un pour PME. Démo gratuite de 30 min avec un expert. +35% de conversion en moyenne chez nos clients. CTA : Demander ma démo (formulaire nom, entreprise, email, taille équipe). Section 3 bénéfices avec icônes. Logo clients (simulés). Ton expert et orienté ROI. Palette bleu corporate/gris.

BRIEF 16 — E-commerce alimentaire
FreshBox. Livraison de courses à domicile. -15€ sur la première commande avec le code FRESH15. Livraison en 2h, produits frais garantis, 5000+ références. CTA : Commander maintenant (bouton). Section fonctionnement en 3 étapes avec icônes. Image hero panier de courses. Ton pratique et moderne. Palette verte/blanche.

BRIEF 17 — Luxe / Horlogerie
Maison Aether Watches. Découvrez la nouvelle collection "Éternité" : montres automatiques en édition limitée (500 exemplaires). CTA : Réserver ma visite privée (bouton). Vidéo du mécanisme. Image hero plein écran de la montre. Détails matériaux et savoir-faire. Ton prestige absolu. Palette noir/or. Minimaliste.

BRIEF 18 — Sport / Club pro
Olympique Club de Lyon. Abonnement saison 2026-2027 : accès à tous les matchs à domicile. Early-bird -20% avant le 30 avril 2026. CTA principal : Souscrire mon abonnement (bouton). Slider photos du stade et des joueurs. Section formules (Essentiel, Premium, VIP). CTA secondaire : Acheter un billet à l'unité. Ton passionné et dynamique. Palette bleu/rouge du club.

BRIEF 19 — Collectivité / Service public
Mairie de Villefranche. Demande de carte d'identité en ligne : simplifiez vos démarches. Formulaire pré-inscription (nom, date de naissance, email, pièces à fournir). Section documents nécessaires avec icônes. Lien pour télécharger les formulaires (drive). Horaires du service et carte. Ton officiel mais accessible. Palette bleu/blanc/rouge.

BRIEF 20 — Jeu-concours / Gamification
Marque SnackFun. Grand jeu de l'été : grattez et tentez de gagner ! Lot principal : voyage à Bali pour 2. + 1000 bons d'achat de 50€. CTA : Tenter ma chance (scratch widget). Section lots à gagner avec images. Règlement du jeu. Effet confetti. Flipcard pour découvrir des indices. Ton fun et excitant. Palette jaune/rose/turquoise.
```

---

## PHASE 1 — GENERATION

Process briefs in batches of `maxParallel` (default 5).

For each batch, launch Task agents **in parallel** (multiple Task tool calls in a single message). Each agent has subagent_type `general-purpose` and receives this prompt:

```
You are generating a landing page for Kreo. Follow these instructions EXACTLY.

## Brief
{INSERT BRIEF TEXT HERE}

## Step 1: Read design guidelines
Read these two files:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Step 2: Generate design JSON
Create a complete DesignDocument JSON for this brief. Rules:
- French text for all user-facing content
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT?text=Description`
- Cohesive color palette matching the sector/tone
- Rich design: multiple sections, spacing, clear visual hierarchy
- Follow ALL layout rules from the guidelines (row→column only, max 2 columns, unique IDs, sequential order)
- No emojis in content (only in icon/effect widget properties)
- Primary CTA above the fold AND repeated at bottom

## Step 3: Write to file
Write the JSON to `.claude/batch/lp-{BRIEF_ID}.json`

## Step 4: Validate
Read `shared/schemas/design.schema.ts` and verify your JSON matches the constraints.

## Step 5: Self-review
Re-read your JSON and check this checklist (report pass/fail for each):
- No emojis in title/text/button content
- Visual hierarchy: main title ≥36px > section titles ≥24px > body ≥14px
- Color contrast: text readable on backgrounds
- Content completeness: hero + 2+ sections + CTA + footer
- Conversion focus: CTA above fold + at bottom, action-oriented text
- Layout balance: balanced column content
- Accessibility: images have alt, form-fields have labels
- Spacing: separators/spacers between sections
- Schema compliance: unique IDs, sequential order, row→column only

Fix any issues (max 2 passes).

## Step 6: Inject via API
Run these Node.js commands via Bash:

1. Login:
```javascript
node -e "
fetch('http://localhost:5174/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'Admin123!' })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d))).catch(e => console.error(e))
"
```

2. Create content:
```javascript
node -e "
const token = '{ACCESS_TOKEN}';
fetch('http://localhost:5174/api/v1/contents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ type: 'landing-page', title: '{LP_TITLE}' })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d))).catch(e => console.error(e))
"
```

3. Inject design:
```javascript
node -e "
const token = '{ACCESS_TOKEN}';
const design = require('fs').readFileSync('.claude/batch/lp-{BRIEF_ID}.json', 'utf8');
fetch('http://localhost:5174/api/v1/contents/{CONTENT_ID}/design', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ design: JSON.parse(design), createVersion: true })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d))).catch(e => console.error(e))
"
```

## Step 7: Screenshot
Run: `node scripts/screenshot-preview.mjs {CONTENT_ID} .claude/batch/screenshots/{SLUG}-preview.png`
Read the screenshot with the Read tool and analyze the visual rendering briefly.

## Step 8: Widget feedback
List any missing widgets, missing widget options, or limitations you encountered. Be specific.
Write your feedback as a JSON object at the end of your response in this format:
```json
FEEDBACK_START
{
  "briefId": {BRIEF_ID},
  "contentId": {CONTENT_ID},
  "title": "{LP_TITLE}",
  "slug": "{SLUG}",
  "feedback": {
    "widgetsManquants": [{"name": "...", "context": "..."}],
    "optionsManquantes": [{"widget": "...", "option": "...", "context": "..."}],
    "limitations": [{"description": "...", "context": "..."}]
  }
}
FEEDBACK_END
```
```

After each batch completes, parse agent outputs and update `.claude/batch/state.json` with contentId, slug, and status for each brief.

---

## PHASE 2 — CRITIQUE

For each successfully generated LP, launch **3 critique agents in parallel** (in batches of `maxParallel`).

### Marketing Expert Agent

```
You are a Marketing & Conversion Expert reviewing a landing page.

## Your LP
- Brief ID: {BRIEF_ID}
- Sector: {SECTOR}
- Read the design JSON: `.claude/batch/lp-{BRIEF_ID}.json`
- View the screenshot: `.claude/batch/screenshots/{SLUG}-preview.png`

## Your evaluation criteria
Rate each aspect 1-10 and provide specific feedback:

1. **Value Proposition** (is the main benefit clear within 3 seconds?)
2. **CTA Effectiveness** (action-oriented text? visible? repeated? contrasting color?)
3. **Urgency & Scarcity** (time limit? limited quantity? FOMO triggers?)
4. **Persuasive Copy** (benefits > features? emotional triggers? social proof?)
5. **Conversion Funnel** (single clear path? no distracting links? progressive engagement?)
6. **Trust Signals** (credibility markers? guarantees? professional tone?)

## Output format
Write your review as JSON to `.claude/batch/critiques/{BRIEF_ID}-marketing.json`:
```json
{
  "role": "marketing",
  "briefId": {BRIEF_ID},
  "scores": {
    "valueProposition": 0,
    "ctaEffectiveness": 0,
    "urgencyScarcity": 0,
    "persuasiveCopy": 0,
    "conversionFunnel": 0,
    "trustSignals": 0
  },
  "averageScore": 0,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "modifications": [
    {
      "priority": "high|medium|low",
      "description": "Exact change to make (be specific: which widget, what text, what style)",
      "rationale": "Why this improves conversion",
      "widgetTarget": "widget_ID or section description"
    }
  ],
  "feedbackProduit": {
    "widgetsManquants": ["countdown-timer: would create urgency for the promo deadline"],
    "optionsManquantes": ["button: needs 'size' property for visual hierarchy between primary/secondary CTAs"],
    "limitations": ["cannot create sticky CTA bar at bottom of viewport"]
  }
}
```
```

### UX/UI Designer Agent

```
You are a UX/UI Design Expert reviewing a landing page for mobile display (400px width).

## Your LP
- Brief ID: {BRIEF_ID}
- Sector: {SECTOR}
- Read the design JSON: `.claude/batch/lp-{BRIEF_ID}.json`
- View the screenshot: `.claude/batch/screenshots/{SLUG}-preview.png`

## Your evaluation criteria
Rate each aspect 1-10 and provide specific feedback:

1. **Visual Hierarchy** (clear reading flow? most important elements stand out?)
2. **Typography** (font sizes logical? readable? consistent?)
3. **Color & Contrast** (palette cohesive? sufficient contrast? accessible?)
4. **Spacing & Layout** (consistent margins? breathing room? no cramped sections?)
5. **Mobile Optimization** (touch-friendly buttons? scrollable? no horizontal overflow?)
6. **Component Consistency** (similar elements styled similarly? design system coherent?)

## Output format
Write your review as JSON to `.claude/batch/critiques/{BRIEF_ID}-ux.json`:
```json
{
  "role": "ux",
  "briefId": {BRIEF_ID},
  "scores": {
    "visualHierarchy": 0,
    "typography": 0,
    "colorContrast": 0,
    "spacingLayout": 0,
    "mobileOptimization": 0,
    "componentConsistency": 0
  },
  "averageScore": 0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "modifications": [
    {
      "priority": "high|medium|low",
      "description": "Exact change (specific widget, property, value)",
      "rationale": "Why this improves UX",
      "widgetTarget": "widget_ID or section"
    }
  ],
  "feedbackProduit": {
    "widgetsManquants": ["..."],
    "optionsManquantes": ["..."],
    "limitations": ["..."]
  }
}
```
```

### Brand Strategist Agent

```
You are a Brand Strategy Expert reviewing a landing page for sector appropriateness.

## Your LP
- Brief ID: {BRIEF_ID}
- Sector: {SECTOR}
- Brief: {BRIEF_TEXT}
- Read the design JSON: `.claude/batch/lp-{BRIEF_ID}.json`
- View the screenshot: `.claude/batch/screenshots/{SLUG}-preview.png`

## Your evaluation criteria
Rate each aspect 1-10 and provide specific feedback:

1. **Sector Fit** (does the design feel right for this industry? would a customer trust it?)
2. **Tone of Voice** (copy style matches the brand personality described in the brief?)
3. **Visual Identity** (colors, imagery, and style match the sector conventions?)
4. **Credibility** (does it look professional? any elements that undermine trust?)
5. **Differentiation** (does it stand out from generic templates? unique sector touches?)
6. **Emotional Resonance** (does it evoke the right emotions for the target audience?)

## Output format
Write your review as JSON to `.claude/batch/critiques/{BRIEF_ID}-brand.json`:
```json
{
  "role": "brand",
  "briefId": {BRIEF_ID},
  "scores": {
    "sectorFit": 0,
    "toneOfVoice": 0,
    "visualIdentity": 0,
    "credibility": 0,
    "differentiation": 0,
    "emotionalResonance": 0
  },
  "averageScore": 0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "modifications": [
    {
      "priority": "high|medium|low",
      "description": "Exact change",
      "rationale": "Why this improves brand perception",
      "widgetTarget": "widget_ID or section"
    }
  ],
  "feedbackProduit": {
    "widgetsManquants": ["..."],
    "optionsManquantes": ["..."],
    "limitations": ["..."]
  }
}
```
```

After all critiques complete, update state.json.

---

## PHASE 3 — VOTE & CONSENSUS

For each LP with 3 complete critiques, launch an arbiter agent.

```
You are an impartial arbiter resolving 3 expert reviews of a landing page.

## Input
Read these 3 critique files:
- `.claude/batch/critiques/{BRIEF_ID}-marketing.json`
- `.claude/batch/critiques/{BRIEF_ID}-ux.json`
- `.claude/batch/critiques/{BRIEF_ID}-brand.json`

## Voting rules
1. For each proposed modification across all 3 reviews:
   - If 2 or 3 reviewers suggest a **similar** change (same widget area, same type of issue) → ACCEPT
   - If only 1 reviewer suggests it → REJECT (unless priority is "high" AND the rationale is compelling)
2. Merge similar modifications into single, clear action items
3. Order accepted modifications by priority (high → medium → low)
4. Calculate overall LP score (average of all 3 reviewers' average scores)

## Output
Write to `.claude/batch/votes/{BRIEF_ID}-consensus.json`:
```json
{
  "briefId": {BRIEF_ID},
  "overallScore": 0,
  "scoresByReviewer": {
    "marketing": 0,
    "ux": 0,
    "brand": 0
  },
  "acceptedModifications": [
    {
      "description": "Clear, actionable description of what to change",
      "supportedBy": ["marketing", "ux"],
      "priority": "high",
      "widgetTarget": "widget_ID or section"
    }
  ],
  "rejectedModifications": [
    {
      "description": "...",
      "suggestedBy": "brand",
      "rejectionReason": "Only 1 reviewer, low priority"
    }
  ]
}
```
```

---

## PHASE 4 — REVISION

For each LP with a consensus vote, launch a revision agent.

```
You are revising a landing page based on expert consensus.

## Design Guidelines (MUST READ)
Read these files first:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Current design
Read: `.claude/batch/lp-{BRIEF_ID}.json`

## Consensus modifications to apply
Read: `.claude/batch/votes/{BRIEF_ID}-consensus.json`

Apply each accepted modification in priority order. For each modification:
1. Locate the target widget(s)
2. Apply the change (content, styles, structure, or new widgets)
3. Ensure the change doesn't break schema compliance

## Save & inject
1. Write the revised JSON to `.claude/batch/lp-{BRIEF_ID}-revised.json`
2. Login to API:
```javascript
node -e "
fetch('http://localhost:5174/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'Admin123!' })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d))).catch(e => console.error(e))
"
```
3. Inject revised design:
```javascript
node -e "
const token = '{ACCESS_TOKEN}';
const design = require('fs').readFileSync('.claude/batch/lp-{BRIEF_ID}-revised.json', 'utf8');
fetch('http://localhost:5174/api/v1/contents/{CONTENT_ID}/design', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ design: JSON.parse(design), createVersion: true })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d))).catch(e => console.error(e))
"
```

4. Screenshot: `node scripts/screenshot-preview.mjs {CONTENT_ID} .claude/batch/screenshots/{SLUG}-revised.png`

## Widget feedback
Report any NEW missing widgets, options, or limitations encountered during revision.
Output at end of response:
```
FEEDBACK_START
{
  "briefId": {BRIEF_ID},
  "phase": "revision",
  "feedback": {
    "widgetsManquants": [],
    "optionsManquantes": [],
    "limitations": []
  }
}
FEEDBACK_END
```
```

---

## PHASE 5 — SYNTHESIS

Launch a single synthesis agent.

```
You are aggregating product feedback from a batch of 20 landing page generations.

## Input files to read
1. All generation feedback: parse FEEDBACK_START/FEEDBACK_END blocks from generation outputs (stored in state)
2. All critique feedback: read `.claude/batch/critiques/*-marketing.json`, `*-ux.json`, `*-brand.json` — extract `feedbackProduit` from each
3. All revision feedback: parse FEEDBACK_START/FEEDBACK_END from revision outputs
4. All vote files: read `.claude/batch/votes/*-consensus.json` — extract scores

## Tasks

### 1. Widget Feedback Aggregation
Group all feedback into 3 categories:
- **Widgets manquants**: group by widget name, count frequency, list which briefs/sectors needed it
- **Options manquantes**: group by (widget, option), count frequency
- **Limitations**: group by limitation type, count frequency

### 2. Score Analysis
Calculate:
- Average score across all 20 LPs (pre-revision and post-revision if available)
- Best and worst LP by score
- Most common weakness category

### 3. Write synthesis report
Write to `.claude/batch/synthesis.md`:

```markdown
# Synthèse Batch — {DATE}

## Scores
- Score moyen pré-révision : X.X / 10
- Score moyen post-révision : X.X / 10
- Meilleure LP : #{ID} ({sector}) — X.X/10
- LP à améliorer : #{ID} ({sector}) — X.X/10

## Top 10 Widgets Manquants
| # | Widget | Fréquence | Secteurs concernés | Priorité |
|---|--------|-----------|--------------------|----------|
| 1 | countdown-timer | 14/20 | Resto, Mode, Voyage... | Critique |
| ... |

## Top 10 Options Manquantes
| # | Widget | Option demandée | Fréquence | Contexte |
|---|--------|-----------------|-----------|----------|
| ... |

## Top 10 Limitations
| # | Limitation | Fréquence | Contournement utilisé |
|---|------------|-----------|-----------------------|
| ... |

## Erreurs récurrentes dans les critiques
| Erreur | Fréquence | Phases concernées |
|--------|-----------|-------------------|
| ... |
```

### 4. Update widget-feedback.md
Read `.claude/widget-feedback.md`. For each NEW entry (not already present), append it to the appropriate table with today's date. Do NOT overwrite existing entries.
```

---

## PHASE 6 — META-ANALYSIS

Launch a single meta-analysis agent.

```
You are performing meta-analysis on a batch LP generation pipeline run.

## Input
- Read `.claude/batch/synthesis.md`
- Read `.claude/batch/state.json` (check for previous run history)
- Read all vote files: `.claude/batch/votes/*-consensus.json`

## Analysis tasks

### 1. Score trends
If previous runs exist in state.json, compare scores and identify trends.

### 2. Recurring critique patterns
Identify the top 5 most common modifications accepted across all votes. These represent systematic weaknesses in the generation prompt.

### 3. Best practices from top LPs
Identify the 3 highest-scored LPs and analyze what they have in common:
- Widget patterns used
- Style choices
- Content structure
- CTA placement

### 4. Recommendations for prompt improvement
Based on recurring critiques, generate specific recommendations for improving:
- `server/services/ai/prompts/design-generation.ts` — new guidelines to add
- `.claude/commands/generate-lp.md` — new checklist items
- Few-shot examples — which LPs to use as examples (score 8+)

### Output
Write to `.claude/batch/meta-analysis.md`:

```markdown
# Meta-Analysis — Run #{RUN_ID} — {DATE}

## Score Summary
- Average: X.X / 10
- Previous run average: X.X / 10 (if available)
- Delta: +/-X.X

## Top 5 Recurring Critique Patterns
| # | Pattern | Frequency | Example |
|---|---------|-----------|---------|
| 1 | CTA text too generic ("En savoir plus") | 12/20 | Brief 3, 7, 15 |
| ... |

## Best Practices from Top LPs
### LP #{ID} — {Sector} (score: X.X)
- Key patterns: ...

## Recommendations for System Improvement

### Prompt additions (`design-generation.ts`)
1. "Always use action-specific CTA text: 'Commander', 'Réserver', 'S'inscrire' — never 'En savoir plus' or 'Cliquez ici'"
2. ...

### Checklist additions (`generate-lp.md`)
1. "CTA text must be action-specific (not generic)"
2. ...

### Few-shot example candidates
- LP #{ID} ({sector}) — score X.X — good example of: {reason}
- LP #{ID} ({sector}) — score X.X — good example of: {reason}
```

Update `state.json` with run summary:
```json
{
  "runs": [
    { "id": 1, "date": "...", "avgScore": X.X, "topIssue": "..." }
  ]
}
```
```

---

## FINAL REPORT

After all phases complete, display to the user:

1. Summary table of all 20 LPs (brief #, sector, title, pre-revision score, post-revision score, status)
2. Top 5 missing widgets (from synthesis)
3. Top 3 system improvement recommendations (from meta-analysis)
4. Link to `.claude/batch/synthesis.md` for full report
5. Link to `.claude/batch/meta-analysis.md` for improvement recommendations
6. Reminder: run `/optimize-lp-pipeline` to apply the recommended improvements

## ERROR HANDLING

- If an agent fails, log `{ phase, briefId, error }` to state.errors and continue
- If auth fails mid-pipeline, re-authenticate and retry the current batch
- At the end, report all errors with instructions to retry specific briefs via `--briefs X,Y`
- Never retry automatically more than once to avoid loops
