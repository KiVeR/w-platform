# Specifications d'implementation -- Profil Programmeur

**Prerequis :** Lire `programmeur-profile-ux.md` et `programmeur-wireframes.md`
**Date :** 2026-03-20

---

## 1. Mapping V1 -> V2 : Le modele Operation

### 1.1 Probleme structurel

En V1, tout est dans le modele `Operation` :
- `etat_id` (FK entier vers table `etats`)
- `programmateur_id` (FK vers `users`)
- `date_previsionnelle`, `date_relance`, `date_routage`
- `ciblage` (texte)
- `repasse`, `repasse_operation_id`

En V2, l'envoi technique est dans `Campaign` :
- `status` (enum CampaignStatus : draft/scheduled/sending/sent/cancelled/failed)
- `routing_status` (enum CampaignRoutingStatus : 14 etats detailles)
- `targeting` (JSON structure)
- `volume_estimated`, `volume_sent`

Le "chainage" Operation -> Campaign n'existe pas encore completement. Le champ `adv_operation_id` existe sur Campaign (FK nullable) mais le modele Operation n'est pas encore cree en V2.

### 1.2 Nouveau modele `Operation` (V2)

```php
// app/Models/Operation.php
class Operation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ref_operation',          // string unique (ex: OP-2024-1234)
        'demande_id',             // FK vers Demande (quand ce modele existera)
        'partner_id',             // FK vers Partner (raccourci, evite join via Demande)
        'programmateur_id',       // FK vers User (le Prog assigne)
        'produit_type',           // enum: LOC, FID, RLOC, ACQ
        'prog_phase',             // enum ProgPhase (comptage, oi, bat, att_bat, etc.)
        'legacy_etat_id',        // int nullable (pour migration V1)
        'priority',               // enum: haute, moyenne, basse
        'date_previsionnelle',    // date nullable
        'date_relance',           // date nullable
        'date_routage',           // date nullable
        'is_repasse',             // bool default false
        'repasse_operation_id',   // FK self nullable
    ];

    // Relations
    public function campaigns(): HasMany  // une operation peut avoir N campaigns (repasse)
    public function programmateur(): BelongsTo  // User
    public function partner(): BelongsTo
    public function parentRepasse(): BelongsTo  // self-ref
    public function repasseChildren(): HasMany  // self-ref
    public function comments(): HasMany  // OperationComment
}
```

### 1.3 Enum ProgPhase

```php
// app/Enums/ProgPhase.php
enum ProgPhase: string
{
    case COMPTAGE = 'comptage';
    case OI = 'oi';
    case BAT = 'bat';
    case ATT_BAT = 'att_bat';
    case A_PROGRAMMER = 'a_programmer';
    case PROGRAMMEE = 'programmee';
    case ROUTAGE = 'routage';
    case ERREUR = 'erreur';
    case STATS = 'stats';
    case TERMINE = 'termine';

    /** Phase suivante dans le workflow normal */
    public function next(): ?self
    {
        return match($this) {
            self::COMPTAGE     => self::OI,
            self::OI           => self::BAT,
            self::BAT          => self::ATT_BAT,
            self::ATT_BAT      => self::A_PROGRAMMER,
            self::A_PROGRAMMER => self::PROGRAMMEE,
            self::PROGRAMMEE   => self::ROUTAGE,
            self::ROUTAGE      => self::STATS,
            self::STATS        => self::TERMINE,
            self::ERREUR       => null,  // pas d'avancement auto depuis erreur
            self::TERMINE      => null,
        };
    }

    /** Les phases qui necessitent une action du Prog */
    public function requiresAction(): bool
    {
        return in_array($this, [
            self::COMPTAGE,
            self::OI,
            self::BAT,
            self::A_PROGRAMMER,
            self::STATS,
            self::ERREUR,
        ]);
    }

    /** Label court pour l'UI */
    public function label(): string
    {
        return match($this) {
            self::COMPTAGE     => 'Comptage',
            self::OI           => 'OI',
            self::BAT          => 'BAT',
            self::ATT_BAT      => 'Att. BAT',
            self::A_PROGRAMMER => 'A prog.',
            self::PROGRAMMEE   => 'Programmee',
            self::ROUTAGE      => 'Routage',
            self::ERREUR       => 'Erreur',
            self::STATS        => 'Stats',
            self::TERMINE      => 'Termine',
        };
    }
}
```

### 1.4 Migration V1 -> V2 des etats

Pour la coexistence V1/V2, le champ `legacy_etat_id` permet de stocker l'ancien ID d'etat.
Le mapping est fait par un Service :

```php
// app/Services/EtatMappingService.php
class EtatMappingService
{
    private const MAP = [
        16 => ProgPhase::COMPTAGE,       // COMPTAGE A FAIRE
        14 => ProgPhase::COMPTAGE,       // COMPTAGE FAIT
        17 => ProgPhase::OI,             // OI A FAIRE
        12 => ProgPhase::OI,             // OI FAITE
        8  => ProgPhase::BAT,            // EN COURS PREPARATION
        3  => ProgPhase::BAT,            // BAT A FAIRE
        13 => ProgPhase::ATT_BAT,        // ATT VALIDATION BAT
        2  => ProgPhase::A_PROGRAMMER,   // A PROGRAMMER
        1  => ProgPhase::PROGRAMMEE,     // PROGRAMMEE
        54 => ProgPhase::PROGRAMMEE,     // EN ATTENTE
        65 => ProgPhase::ROUTAGE,        // ROUTAGE EN COURS
        66 => ProgPhase::ERREUR,         // ROUTAGE EN ERREUR
        77 => ProgPhase::ERREUR,         // ROUTAGE INCOMPLET
        19 => ProgPhase::STATS,          // STATS A FAIRE
        44 => ProgPhase::TERMINE,        // TERMINEE
    ];

    public static function fromLegacy(int $etatId): ProgPhase
    {
        return self::MAP[$etatId] ?? ProgPhase::COMPTAGE;
    }
}
```

---

## 2. Endpoints API

### 2.1 Liste des operations du Prog

```
GET /api/operations
```

**Query params :**
- `filter[programmateur_id]` : int (default: authenticated user)
- `filter[prog_phase]` : string (comma-separated ProgPhase values)
- `filter[produit_type]` : string (LOC,FID,RLOC,ACQ)
- `filter[priority]` : string (haute,moyenne,basse)
- `filter[date_relance_from]` : date
- `filter[date_relance_to]` : date
- `filter[search]` : string (recherche ref_operation ou partner name)
- `sort` : string (date_relance, date_previsionnelle, priority, -created_at)
- `group_by` : string (date_relance_group | prog_phase)
- `include` : string (partner, campaigns, campaigns.stats)
- `page[size]` : int (default 50)

**Response :**
```json
{
  "data": [
    {
      "id": 1234,
      "ref_operation": "OP-2024-1234",
      "partner": { "id": 5, "name": "Carrefour Lyon" },
      "programmateur_id": 12,
      "produit_type": "LOC",
      "prog_phase": "comptage",
      "priority": "haute",
      "date_previsionnelle": "2026-03-20",
      "date_relance": "2026-03-20",
      "date_relance_group": "today",
      "is_overdue": true,
      "overdue_days": 1,
      "campaigns": [
        {
          "id": 789,
          "status": "draft",
          "routing_status": null,
          "volume_estimated": null,
          "targeting": { "zones": [...] }
        }
      ],
      "cta": {
        "action": "launch_counting",
        "label": "Lancer comptage"
      }
    }
  ],
  "meta": {
    "summary": {
      "comptage": 4,
      "oi": 2,
      "bat": 3,
      "att_bat": 1,
      "a_programmer": 2,
      "programmee": 1,
      "routage": 1,
      "erreur": 1,
      "stats": 1,
      "total": 16,
      "overdue": 2,
      "errors": 1
    },
    "groups": [
      { "key": "overdue", "label": "Urgent", "count": 2 },
      { "key": "today", "label": "A traiter aujourd'hui", "count": 8 },
      { "key": "tomorrow", "label": "Planifie demain", "count": 3 },
      { "key": "this_week", "label": "Cette semaine", "count": 3 }
    ]
  }
}
```

Le champ `cta` est calcule cote serveur pour chaque operation, basee sur `prog_phase` et les conditions contextuelles.

### 2.2 Avancer l'etat d'une operation

```
PATCH /api/operations/{id}/advance
```

**Body :** (optionnel)
```json
{
  "target_phase": "oi",        // optionnel : force une phase specifique
  "metadata": {                 // donnees contextuelles selon la transition
    "volume_estimated": 670366, // si transition depuis comptage
    "scheduled_at": "2026-03-24T10:30:00+01:00"  // si transition vers programmee
  }
}
```

**Response :**
```json
{
  "data": {
    "id": 1234,
    "prog_phase": "oi",
    "previous_phase": "comptage",
    "advanced_at": "2026-03-20T14:30:00+01:00"
  }
}
```

### 2.3 Avancement en masse

```
POST /api/operations/bulk-advance
```

**Body :**
```json
{
  "operation_ids": [1234, 1235, 1236],
  "target_phase": null  // null = phase suivante automatique pour chacune
}
```

### 2.4 Synthese de charge

```
GET /api/operations/summary
```

**Query params :**
- `programmateur_id` : int (ou `all` pour le manager)
- `date_from` : date
- `date_to` : date

**Response :**
```json
{
  "data": {
    "by_phase": {
      "comptage": 4, "oi": 2, "bat": 3,
      "att_bat": 1, "a_programmer": 2,
      "total": 12, "overdue": 2, "errors": 1
    },
    "by_day": [
      { "date": "2026-03-16", "count": 4, "capacity": 5 },
      { "date": "2026-03-17", "count": 3, "capacity": 5 },
      { "date": "2026-03-18", "count": 2, "capacity": 5 }
    ],
    "trend_vs_yesterday": 3
  }
}
```

### 2.5 Progression routage (polling)

```
GET /api/campaigns/{id}/routing-progress
```

**Response :**
```json
{
  "data": {
    "campaign_id": 789,
    "routing_status": "ROUTING_IN_PROGRESS",
    "phases": [
      { "name": "query", "status": "completed", "started_at": "14:30:01", "completed_at": "14:30:05" },
      { "name": "short_url", "status": "completed", "started_at": "14:31:12", "completed_at": "14:31:15" },
      { "name": "message_generation", "status": "completed", "started_at": "14:31:45", "completed_at": "14:31:50" },
      { "name": "routing", "status": "in_progress", "started_at": "14:32:00", "completed_at": null }
    ],
    "volume_sent": 301665,
    "volume_total": 670366,
    "progress_percent": 45,
    "estimated_remaining_seconds": 840,
    "error_message": null
  }
}
```

### 2.6 Creer une repasse

```
POST /api/operations/{id}/repasse
```

**Response :**
```json
{
  "data": {
    "new_operation_id": 1500,
    "ref_operation": "OP-2024-1500",
    "volume_remaining": 258366,
    "targeting": { "...copie depuis l'original..." },
    "parent_operation_id": 1234
  }
}
```

### 2.7 Declaration d'absence

```
POST /api/programmateurs/{id}/absences
```

**Body :**
```json
{
  "date_from": "2026-03-25",
  "date_to": "2026-03-28",
  "period": "all_day",
  "reason": "conges",
  "auto_reassign": true
}
```

**Response :**
```json
{
  "data": {
    "absence_id": 45,
    "affected_operations": [
      { "id": 1234, "reassigned_to": { "id": 15, "name": "Pierre D." } },
      { "id": 1235, "reassigned_to": { "id": 15, "name": "Pierre D." } },
      { "id": 1236, "reassigned_to": { "id": 18, "name": "Marie L." } },
      { "id": 1237, "reassigned_to": null, "reason": "no_available_programmer" }
    ]
  }
}
```

### 2.8 Reassignation en masse

```
POST /api/operations/bulk-reassign
```

**Body :**
```json
{
  "assignments": [
    { "operation_id": 1234, "programmateur_id": 15 },
    { "operation_id": 1235, "programmateur_id": 15 },
    { "operation_id": 1236, "programmateur_id": 18 }
  ]
}
```

---

## 3. Store Pinia principal

```typescript
// stores/production.ts

interface ProductionState {
  // Data
  operations: Operation[]
  summary: PhaseSummary | null
  groups: OperationGroup[]

  // UI
  viewMode: 'list' | 'calendar' | 'pipeline'
  selectedIds: Set<number>
  activeSheet: {
    operationId: number
    panel: PanelType
  } | null

  // Filters
  filters: {
    progPhase: ProgPhase[] | null
    produitType: ProduitType[] | null
    priority: Priority[] | null
    search: string
    dateRange: { from: string; to: string } | null
  }

  // Loading
  isLoading: boolean
  isAdvancing: boolean
}

type PanelType =
  | 'comptage'
  | 'oi'
  | 'bat'
  | 'programmation'
  | 'routage'
  | 'erreur'
  | 'stats'

// Actions cles
interface ProductionActions {
  // Chargement
  fetchOperations(): Promise<void>
  fetchSummary(): Promise<void>

  // Navigation
  openSheet(operationId: number, panel?: PanelType): void
  closeSheet(): void

  // Workflow
  advanceOperation(id: number, metadata?: Record<string, unknown>): Promise<void>
  bulkAdvance(ids: number[]): Promise<void>
  revertOperation(id: number): Promise<void>

  // Selection
  toggleSelect(id: number): void
  selectAll(): void
  clearSelection(): void

  // Filtres
  setFilter(key: string, value: unknown): void
  clearFilters(): void
}
```

### 3.1 Logique du CTA contextuel (frontend)

```typescript
// composables/useOperationCta.ts

interface OperationCta {
  action: string
  label: string
  icon: Component
  variant: 'default' | 'destructive' | 'outline'
  panel: PanelType | null  // null = action directe sans panneau
}

function getOperationCta(operation: Operation): OperationCta {
  switch (operation.prog_phase) {
    case 'comptage':
      return {
        action: 'launch_counting',
        label: 'Lancer comptage',
        icon: Calculator,
        variant: 'default',
        panel: 'comptage',
      }
    case 'oi':
      return {
        action: 'create_oi',
        label: 'Creer OI',
        icon: FileText,
        variant: 'default',
        panel: 'oi',
      }
    case 'bat':
      return {
        action: 'prepare_bat',
        label: 'Preparer BAT',
        icon: Eye,
        variant: 'default',
        panel: 'bat',
      }
    case 'att_bat':
      return {
        action: 'follow_up',
        label: 'Relancer client',
        icon: Clock,
        variant: 'outline',
        panel: null,  // action directe : envoie notification
      }
    case 'a_programmer':
      return {
        action: 'schedule',
        label: 'Programmer',
        icon: Calendar,
        variant: 'default',
        panel: 'programmation',
      }
    case 'programmee':
      if (isReadyForRouting(operation)) {
        return {
          action: 'launch_routing',
          label: 'Lancer routage',
          icon: Send,
          variant: 'default',
          panel: 'routage',
        }
      }
      return {
        action: 'view',
        label: `Prevu ${formatDate(operation.scheduled_at)}`,
        icon: CalendarCheck,
        variant: 'outline',
        panel: null,
      }
    case 'routage':
      return {
        action: 'monitor',
        label: 'En cours...',
        icon: Loader2,  // animated spinner
        variant: 'outline',
        panel: 'routage',
      }
    case 'erreur':
      return {
        action: 'view_error',
        label: 'Voir erreur',
        icon: AlertTriangle,
        variant: 'destructive',
        panel: 'erreur',
      }
    case 'stats':
      return {
        action: 'view_stats',
        label: 'Voir stats',
        icon: BarChart,
        variant: 'outline',
        panel: 'stats',
      }
    case 'termine':
      return {
        action: 'view',
        label: 'Consulter',
        icon: CheckCircle,
        variant: 'outline',
        panel: null,
      }
  }
}
```

---

## 4. Composants Vue -- arbre complet

```
pages/
  production/
    planning.vue           << W1 - Page principale
    pipeline.vue           << W6 - Vue Kanban
    charge.vue             << W8 - Vue charge equipe (manager)
    routage.vue            << W9 - Monitoring routage live

components/
  production/
    ProductionView.vue              << Layout principal avec groupes
    ProductionHeader.vue            << W1 barre de synthese
    ProductionFilters.vue           << Barre de filtres
    OperationRow.vue                << Ligne d'operation avec CTA
    OperationGroupHeader.vue        << Header de section (Urgent, Aujourd'hui...)
    BulkActionBar.vue               << W7 barre d'actions en masse

    sheets/
      OperationSheet.vue            << Sheet wrapper generique
      ComptagePanel.vue             << W2 panneau comptage
      OiPanel.vue                   << Panneau OI (similaire a comptage, plus simple)
      BatPanel.vue                  << W3 panneau BAT
      ProgrammationPanel.vue        << W4 panneau programmation
      RoutagePanel.vue              << W5 panneau erreur + monitoring
      StatsPanel.vue                << Panneau stats post-envoi

    pipeline/
      PipelineBoard.vue             << W6 board Kanban
      PipelineColumn.vue            << Colonne du Kanban
      PipelineCard.vue              << Carte d'operation dans le Kanban

    calendar/
      CalendarGrid.vue              << W10 grille calendrier
      CalendarDayCell.vue           << Cellule jour avec chips
      CalendarOperationChip.vue     << Chip draggable
      CalendarChargeBar.vue         << Barre de charge sous le jour

    charge/
      ChargeEquipeTable.vue         << W8 tableau charge equipe
      ProgrammateurRow.vue          << Ligne d'un Prog avec barres
      UnassignedOperations.vue      << Liste operations sans Prog

    dialogs/
      AbsenceDialog.vue             << W11 declaration absence
      ReassignDialog.vue            << Reassignation d'operations
      RepasseDialog.vue             << Creation repasse automatique
      RoutageMultipleDialog.vue     << Routage en masse

    shared/
      PhaseProgress.vue             << Timeline verticale des phases routage
      PhaseBadge.vue                << Badge colore par phase
      PriorityDot.vue               << Dot rouge/orange/gris
      ProduitBadge.vue              << Badge LOC/FID/RLOC/ACQ
      OverdueBadge.vue              << Badge "RETARD Xj" rouge
      ChargeBar.vue                 << Barre horizontale de charge
```

---

## 5. Plan d'execution phase

### Phase P1 : Fondation API + Store (Sprint 2-3 semaines)

**Objectif :** Le Prog peut voir sa liste d'operations groupee et filtree.

**API :**
- [ ] Migration `create_operations_table`
- [ ] Model `Operation` avec relations
- [ ] Enum `ProgPhase`, `ProduitType`, `OperationPriority`
- [ ] `OperationResource` avec computed `cta`
- [ ] `GET /operations` avec Spatie QueryBuilder
- [ ] `GET /operations/summary`
- [ ] Tests API (objectif: 30+ tests)

**Frontend :**
- [ ] Store `useProductionStore`
- [ ] Composable `useOperationCta`
- [ ] Page `production/planning.vue`
- [ ] `ProductionView`, `ProductionHeader`, `ProductionFilters`
- [ ] `OperationRow`, `OperationGroupHeader`
- [ ] `PhaseBadge`, `PriorityDot`, `ProduitBadge`, `OverdueBadge`
- [ ] Tests frontend (objectif: 30+ tests)

**Livrable :** La vue liste est fonctionnelle avec donnees reelles.

### Phase P2 : Panneaux lateraux (Sprint 2-3 semaines)

**Objectif :** Le Prog peut traiter ses operations depuis le panneau lateral.

**API :**
- [ ] `PATCH /operations/{id}/advance` avec transitions validees
- [ ] Service `OperationWorkflowService` (avancement + undo)
- [ ] Tests API (objectif: 20+ tests)

**Frontend :**
- [ ] `OperationSheet` generique
- [ ] `ComptagePanel` (reutilise targeting layer)
- [ ] `BatPanel` (reutilise SectionMessage)
- [ ] `ProgrammationPanel` (date picker + suggestions)
- [ ] `PhaseProgress` (timeline routage)
- [ ] Auto-avancement + toast undo (vue-sonner)
- [ ] Tests frontend (objectif: 25+ tests)

**Livrable :** Le workflow complet comptage -> programmation est fonctionnel.

### Phase P3 : Actions en masse + Monitoring (Sprint 1-2 semaines)

**Objectif :** Le Prog peut agir en masse et surveiller les routages.

**API :**
- [ ] `POST /operations/bulk-advance`
- [ ] `GET /campaigns/{id}/routing-progress`
- [ ] Tests API (objectif: 15+ tests)

**Frontend :**
- [ ] `BulkActionBar` (position fixed)
- [ ] Selection multiple (checkbox + shift-click)
- [ ] Page `production/routage.vue` avec polling
- [ ] `RoutagePanel` (erreur + monitoring)
- [ ] Tests frontend (objectif: 15+ tests)

**Livrable :** Routage multiple et monitoring live.

### Phase P4 : Planning calendrier + Charge equipe (Sprint 2 semaines)

**Objectif :** Vues planning et charge pour le Prog et son manager.

**API :**
- [ ] `POST /programmateurs/{id}/absences`
- [ ] `POST /operations/bulk-reassign`
- [ ] `GET /programmateurs/charge` (vue equipe)
- [ ] Tests API (objectif: 15+ tests)

**Frontend :**
- [ ] `CalendarGrid` + drag-and-drop
- [ ] `AbsenceDialog` avec preview d'impact
- [ ] Page `production/charge.vue`
- [ ] `ChargeEquipeTable` + `ReassignDialog`
- [ ] Tests frontend (objectif: 20+ tests)

**Livrable :** Planning calendrier et gestion des absences.

### Phase P5 : Pipeline Kanban + Repasse + Polish (Sprint 1-2 semaines)

**Objectif :** Vues complementaires et finitions.

**API :**
- [ ] `POST /operations/{id}/repasse`
- [ ] Tests API (objectif: 10+ tests)

**Frontend :**
- [ ] Page `production/pipeline.vue` (Kanban)
- [ ] `RepasseDialog`
- [ ] Raccourcis clavier (j/k/Enter/Space)
- [ ] Command palette integration
- [ ] Tests frontend (objectif: 15+ tests)

**Livrable :** Produit complet pour le profil Programmeur.

### Estimation totale

| Phase | API tests | Frontend tests | Duree estimee |
|---|---|---|---|
| P1 Fondation | +30 | +30 | 2-3 semaines |
| P2 Panneaux | +20 | +25 | 2-3 semaines |
| P3 Masse + Monitoring | +15 | +15 | 1-2 semaines |
| P4 Planning + Charge | +15 | +20 | 2 semaines |
| P5 Kanban + Polish | +10 | +15 | 1-2 semaines |
| **TOTAL** | **+90** | **+105** | **8-12 semaines** |

Cumul apres completion :
- API : 673 + 90 = ~763 tests
- Frontend : 510 + 105 = ~615 tests

---

## 6. Considerations techniques specifiques

### 6.1 Reutilisation du layer targeting

Le `ComptagePanel` reutilise les composants du layer `@wellpack/targeting` :
- `SmartSearch` pour la recherche geo
- `TargetingMap` pour la carte
- `DemographicsSelector` pour age/genre
- `CommuneSelector`, `DepartmentSelector`, etc.

Ces composants sont deja auto-importes via le Nuxt layer. La seule adaptation necessaire est le contexte : dans le wizard actuel, ils ecrivent dans le `campaignWizardStore`. Dans le panneau Production, ils devront ecrire dans un store local ou recevoir le targeting en prop.

**Solution proposee :** Extraire la logique de targeting dans un composable `useTargetingEditor(initialValue)` qui est agnostique du store. Le wizard et le panneau Production l'utilisent chacun avec leur propre source de donnees.

### 6.2 Polling pour le monitoring routage

Le monitoring live (W9) utilise un polling simple :

```typescript
// composables/useRoutagePolling.ts
function useRoutagePolling(campaignIds: Ref<number[]>) {
  const progress = ref<Map<number, RoutingProgress>>(new Map())
  const POLL_INTERVAL = 5000 // 5 secondes

  const { pause, resume } = useIntervalFn(async () => {
    for (const id of campaignIds.value) {
      const data = await fetchRoutingProgress(id)
      progress.value.set(id, data)

      // Arreter le polling si le routage est termine
      if (data.routing_status === 'ROUTING_COMPLETED' ||
          data.routing_status === 'ROUTING_FAILED') {
        campaignIds.value = campaignIds.value.filter(cid => cid !== id)
      }
    }
  }, POLL_INTERVAL)

  return { progress, pause, resume }
}
```

Pas de WebSocket pour la V1 de cette feature -- le polling est suffisant pour 1-5 routages simultanees.

### 6.3 Drag-and-drop calendrier

Le calendrier (W10) necessite du drag-and-drop. Options :

1. **`@vueuse/core` `useDraggable`** -- simple mais basique
2. **`vue-draggable-next`** (fork de Sortable.js pour Vue 3) -- mature et accessible
3. **HTML5 Drag and Drop API** -- natif mais API penible

**Recommandation :** `vue-draggable-next` car il gere les contraintes (drop zones valides) et les animations. Deja utilise dans des patterns similaires (Kanban boards).

### 6.4 Raccourcis clavier

```typescript
// composables/useProductionKeyboard.ts
import { useMagicKeys, whenever } from '@vueuse/core'

function useProductionKeyboard(store: ReturnType<typeof useProductionStore>) {
  const { j, k, enter, space, shift, ctrl, f, slash } = useMagicKeys()

  // Navigation
  whenever(j, () => store.selectNext())
  whenever(k, () => store.selectPrevious())

  // Actions
  whenever(enter, () => store.executeCta())
  whenever(space, () => store.toggleCurrentCheckbox())
  whenever(() => shift.value && enter.value, () => store.advanceCurrent())

  // Recherche
  whenever(() => ctrl.value && f.value, () => store.focusSearch())
  whenever(slash, () => store.focusSearch())
}
```

### 6.5 Permissions (Spatie)

Nouvelles permissions pour la section Production :

```php
// database/seeders/RolePermissionSeeder.php (ajouts)

// Permissions
'view operations'       // Voir ses propres operations
'manage operations'     // Avancer/modifier les operations
'view team operations'  // Voir les operations de l'equipe (manager)
'manage team operations'// Reassigner (manager)
'manage absences'       // Declarer/modifier les absences

// Role "programmeur" : view operations, manage operations, manage absences
// Role "responsable_prog" : tous les permissions ci-dessus + view/manage team
```
