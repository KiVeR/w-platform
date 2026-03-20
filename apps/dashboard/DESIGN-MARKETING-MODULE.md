# Module Marketing Creatif -- Specification UX/UI Complete

> Version 1.0 -- Mars 2026
> Integre le design system existant : Tailwind v4, shadcn-vue, tokens oklch, layout Sidebar + SidebarInset

---

## Table des matieres

1. [Personas et besoins](#1-personas-et-besoins)
2. [Architecture informationnelle](#2-architecture-informationnelle)
3. [Navigation et integration sidebar](#3-navigation-et-integration-sidebar)
4. [Dashboard Marketing Manager](#4-dashboard-marketing-manager)
5. [Dashboard Graphiste](#5-dashboard-graphiste)
6. [Workflow creatif modernise](#6-workflow-creatif-modernise)
7. [Detail d'un Marketing Workflow](#7-detail-dun-marketing-workflow)
8. [Systeme de feedback et review](#8-systeme-de-feedback-et-review)
9. [Integration fichiers et preview](#9-integration-fichiers-et-preview)
10. [Brief enrichi](#10-brief-enrichi)
11. [Notifications creatives](#11-notifications-creatives)
12. [Tokens et composants specifiques](#12-tokens-et-composants-specifiques)
13. [Types TypeScript](#13-types-typescript)
14. [Composants Vue -- specifications](#14-composants-vue--specifications)
15. [Responsive et accessibilite](#15-responsive-et-accessibilite)
16. [Plan d'implementation](#16-plan-dimplementation)

---

## 1. Personas et besoins

### Persona 1 : Graphiste (Lea, 28 ans)

**Contexte** : Travaille sur 8-12 operations en parallele. Utilise Photoshop/Figma pour creer, puis upload dans l'ADV. Passe 60% de son temps en production, 25% en aller-retour de feedbacks, 15% a chercher le contexte.

**Besoins primaires :**
- Voir ses missions assignees en un coup d'oeil, triees par urgence
- Comprendre le brief sans poser de questions (audience, objectif, contraintes)
- Uploader ses creations et voir le resultat inline sans quitter l'outil
- Recevoir les retours structures (pas un email vague "c'est pas ca")
- Savoir precisement quel element corriger dans quelle version

**Irritants actuels :**
- Doit telecharger un fichier pour savoir de quoi il s'agit
- Les commentaires sont melanges entre versions
- Pas de preview du rendu final (surtout landing pages HTML)
- Ne voit jamais le ciblage/audience de la campagne

**Besoins UX :** Interface propre, visuellement aeree, qui met les creations au centre. Peu de texte, beaucoup de previews. Navigation rapide entre operations.

### Persona 2 : Marketing Manager (Sophie, 35 ans)

**Contexte** : Supervise 3 graphistes et 40-60 operations/mois. Passe 40% en coordination, 30% en validation, 20% en relance client, 10% en reporting.

**Besoins primaires :**
- Vue panoramique de la charge : qui fait quoi, quels sont les retards
- Valider rapidement les creations (approve/reject en 1 clic)
- Suivre les relances client (qui attend depuis combien de temps)
- Assigner/reassigner les graphistes selon la charge
- Voir les metriques de productivite (temps moyen par brief, taux de retour)

**Irritants actuels :**
- Pas de vue de charge par graphiste
- Les relances client sont manuelles (pas de rappel automatique)
- Pas de metriques (impossible de savoir si le process s'ameliore)
- 5 onglets legacy confus (les operations migrent entre onglets sans logique claire)

**Besoins UX :** Tableaux de bord denses mais lisibles. KPIs en haut, listes filtrables en dessous. Actions batch. Peu de clics pour valider.

---

## 2. Architecture informationnelle

### Structure des pages

```
/marketing                          -- Dashboard (adapte selon role)
/marketing/workflows                -- Liste des workflows creatifs
/marketing/workflows/:id            -- Detail d'un workflow (brief + versions + feedback)
/marketing/workflows/:id/review     -- Mode review plein ecran (annotations visuelles)
/marketing/calendar                 -- Vue calendrier des deadlines
/marketing/settings                 -- Config (graphistes, templates de brief, etc.)
```

### Modele de donnees conceptuel

```
MarketingWorkflow
  id, operation_id, partner_id
  title, brief_text, brief_context (JSON)
  graphiste_id (FK user), charge_marketing_id (FK user)
  etat: MarketingStatus (enum)
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline_at, started_at, completed_at
  dtsf: { date, time, sequence, frequency } (JSON)
  created_at, updated_at

MarketingVersion
  id, workflow_id
  version_number (auto-increment par workflow)
  file_path, file_type, file_size, thumbnail_path
  uploaded_by (FK user)
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  created_at

MarketingComment
  id, workflow_id, version_id (nullable -- global ou sur version)
  author_id (FK user), author_role ('graphiste' | 'manager' | 'client')
  body (text)
  annotation: { x, y, width, height, page } | null  (coordonnees pour annotations visuelles)
  resolved_at, resolved_by
  parent_id (nullable, pour threads)
  created_at
```

### Etats du workflow (MarketingStatus)

```typescript
type MarketingStatus =
  | 'brief_pending'     // Brief a creer ou a assigner
  | 'in_production'     // Graphiste travaille dessus
  | 'in_review'         // Soumis pour validation manager
  | 'client_review'     // Envoye au client pour validation
  | 'revision'          // Client a demande des modifications
  | 'approved'          // Valide, pret pour livraison
  | 'delivered'         // Livre et termine
  | 'on_hold'           // En attente (bloque)
  | 'cancelled'         // Annule
```

**Mapping depuis legacy :**
```
BRIEF A FAIRE (62) --> brief_pending
CREA EN PROD (63)  --> in_production
EN COURS (69)      --> in_review | client_review
RETOUR (71)        --> revision
TERMINE (70)       --> approved | delivered
ANNULE (72)        --> cancelled
Stand by           --> on_hold
```

---

## 3. Navigation et integration sidebar

### Ajout dans AppSidebar.vue

Un nouveau groupe de navigation "Production" s'insere entre "Principal" et "Configuration" :

```typescript
// Dans navGroups computed, apres le groupe main :
{
  label: t('nav.groups.production'),
  items: [
    { label: t('nav.marketing'), icon: Palette, to: '/marketing' },
  ],
}
```

L'icone `Palette` (lucide-vue-next) est choisie pour representer le volet creatif sans confusion avec `Send` (campagnes) ni `Megaphone` (KPIs).

### Badge de notifications dans la sidebar

Un `SidebarMenuBadge` affiche le nombre d'actions en attente :
- Pour le graphiste : nombre de briefs non commences + feedbacks non lus
- Pour le manager : nombre de creations en attente de review

```vue
<SidebarMenuButton as-child :tooltip="item.label" :data-active="isActive(item.to)">
  <NuxtLink :to="item.to">
    <component :is="item.icon" />
    <span>{{ item.label }}</span>
  </NuxtLink>
  <SidebarMenuBadge v-if="marketingPendingCount > 0">
    {{ marketingPendingCount }}
  </SidebarMenuBadge>
</SidebarMenuButton>
```

---

## 4. Dashboard Marketing Manager

### Layout

La page `/marketing` detecte le role de l'utilisateur et affiche le dashboard adapte. Pour le Marketing Manager, la structure est :

```
+------------------------------------------------------------------+
|  Header hero (style identique a index.vue)                       |
|  "Production creative" | Sous-titre | Filtre periode             |
+------------------------------------------------------------------+
|  KPI Grid (4 cards)                                              |
|  [En attente] [En production] [En review] [Retards]              |
+------------------------------------------------------------------+
|  Grid 2 colonnes                                                 |
|  +------------------------------+  +---------------------------+ |
|  | Charge par graphiste         |  | Deadlines proches         | |
|  | (stacked bar chart)          |  | (timeline verticale)      | |
|  +------------------------------+  +---------------------------+ |
+------------------------------------------------------------------+
|  Tableau des workflows actifs                                    |
|  [Filtres: statut, graphiste, priorite, date]                    |
|  [DataTable triable avec actions batch]                          |
+------------------------------------------------------------------+
```

### KPI Cards

Reutilise `DashboardKpiCard` avec les tones existants :

| Card | Valeur | Tone | Icone |
|------|--------|------|-------|
| En attente de brief | Nombre workflows `brief_pending` | `primary` | `ClipboardList` |
| En production | Nombre workflows `in_production` | `info` | `Paintbrush` |
| En review | Nombre workflows `in_review` + `client_review` | `success` | `Eye` |
| Retards | Nombre workflows ou `deadline_at < now()` et statut != `delivered`/`cancelled` | `error` | `AlertTriangle` |

### Charge par graphiste (Stacked Bar Chart)

Un graphique en barres horizontales empilees, une barre par graphiste :

```
Lea Martin    ████████░░░░░░░░  12 ops (4 brief, 5 prod, 3 review)
Hugo Durand   ██████░░░░░░░░░░   8 ops (2 brief, 4 prod, 2 review)
Elsa Moreau   ████░░░░░░░░░░░░   5 ops (1 brief, 3 prod, 1 review)
```

Couleurs des segments :
- `brief_pending` : `--color-warning-500` (oklch 0.850 0.165 95)
- `in_production` : `--color-info-500` (oklch 0.623 0.214 259)
- `in_review` / `client_review` : `--color-success-500` (oklch 0.723 0.191 149)
- `revision` : `--color-orange-500` (oklch 0.750 0.170 70)
- `on_hold` : `--color-zinc-400` (oklch 0.707 0.015 286)

Composant : `MarketingWorkloadChart.vue` dans `components/marketing/dashboard/`.

### Deadlines proches (Timeline verticale)

Liste verticale des 8 prochaines deadlines, triees par urgence :

```vue
<Card>
  <CardHeader>
    <CardTitle class="text-sm font-medium">{{ t('marketing.deadlines.title') }}</CardTitle>
  </CardHeader>
  <CardContent class="space-y-3">
    <div v-for="item in upcomingDeadlines" :key="item.id"
         class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
      <!-- Indicateur temporel -->
      <div class="flex flex-col items-center">
        <div class="size-2.5 rounded-full"
             :class="deadlineUrgencyDot(item.deadline_at)" />
        <div class="w-px flex-1 bg-border" />
      </div>
      <!-- Contenu -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ item.title }}</p>
        <div class="flex items-center gap-2 mt-0.5">
          <Avatar class="size-5">
            <AvatarFallback class="text-[10px]">{{ item.graphiste_initials }}</AvatarFallback>
          </Avatar>
          <span class="text-xs text-muted-foreground">{{ item.graphiste_name }}</span>
        </div>
      </div>
      <!-- Countdown -->
      <MarketingDeadlineCountdown :deadline="item.deadline_at" />
    </div>
  </CardContent>
</Card>
```

Logique des couleurs du dot :
- Plus de 3 jours : `bg-success-500`
- 1-3 jours : `bg-warning-500`
- Moins de 24h : `bg-error-500` + animation pulse
- Depasse : `bg-error-500` + ring `ring-2 ring-error-500/30`

### Tableau des workflows actifs

Reutilise le pattern de `CampaignDataTable.vue` :

**Colonnes :**
| Colonne | Contenu | Triable |
|---------|---------|---------|
| Operation | Nom de l'operation (lien) | oui |
| Statut | `MarketingStatusBadge` (voir section 12) | filtre |
| Graphiste | Avatar + nom | filtre |
| Priorite | Badge colore (low/medium/high/urgent) | oui |
| Deadline | Date relative + countdown si < 3j | oui |
| Version | "v3" (derniere version uploade) | non |
| Actions | Menu `...` (assigner, relancer, voir) | non |

**Filtres** (style identique a `CampaignFilters.vue`) :
- Recherche texte (nom operation)
- Multi-select statut (checkboxes dans Popover, pattern `CampaignMultiStatusFilter`)
- Select graphiste (dropdown)
- Select priorite (dropdown)
- Date range (deadline)

**Actions batch** (nouveau pattern) :
- Checkbox en premiere colonne de chaque ligne
- Barre d'actions contextuelle qui apparait en haut du tableau quand >= 1 ligne selectionnee :

```vue
<div v-if="selectedCount > 0"
     class="flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-2 mb-3">
  <span class="text-sm font-medium">
    {{ t('marketing.batch.selected', { count: selectedCount }) }}
  </span>
  <Button variant="outline" size="sm" @click="batchAssign">
    <UserPlus class="mr-1.5 size-3.5" />
    {{ t('marketing.batch.assign') }}
  </Button>
  <Button variant="outline" size="sm" @click="batchChangePriority">
    <Flag class="mr-1.5 size-3.5" />
    {{ t('marketing.batch.priority') }}
  </Button>
  <Button variant="ghost" size="sm" class="ml-auto" @click="clearSelection">
    {{ t('marketing.batch.clear') }}
  </Button>
</div>
```

---

## 5. Dashboard Graphiste

### Layout

Pour le graphiste, la page `/marketing` affiche une vue centree sur ses missions :

```
+------------------------------------------------------------------+
|  Header compact                                                  |
|  "Mes missions" | x operations en cours                         |
+------------------------------------------------------------------+
|  Quick stats (3 mini-cards inline)                               |
|  [A faire: 4] [En cours: 6] [Feedbacks: 2]                      |
+------------------------------------------------------------------+
|  Kanban board OU Liste (toggle)                                  |
|  +----------+ +----------+ +----------+ +----------+             |
|  | A FAIRE  | | EN PROD  | | REVIEW   | | TERMINE  |            |
|  | Card     | | Card     | | Card     | | Card     |            |
|  | Card     | | Card     | |          | |          |            |
|  | Card     | |          | |          | |          |            |
|  +----------+ +----------+ +----------+ +----------+             |
+------------------------------------------------------------------+
```

### Quick Stats (inline)

Trois badges/chips en ligne, pas des Cards completes (le graphiste veut du visuel, pas des tableaux) :

```vue
<div class="flex items-center gap-3">
  <button @click="filterByStatus('brief_pending')"
          class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm
                 transition-colors hover:bg-warning-100/50"
          :class="activeFilter === 'brief_pending' ? 'bg-warning-100 border-warning-500/30' : ''">
    <span class="size-2 rounded-full bg-warning-500" />
    <span class="font-semibold">{{ briefCount }}</span>
    <span class="text-muted-foreground">{{ t('marketing.graphiste.toDo') }}</span>
  </button>
  <!-- Meme pattern pour in_production et revision -->
</div>
```

### Kanban Board

La vue par defaut du graphiste est un Kanban a 4 colonnes. Chaque colonne correspond a un groupe de statuts :

| Colonne | Statuts inclus | Couleur header |
|---------|----------------|----------------|
| A faire | `brief_pending` | `border-t-warning-500` |
| En prod | `in_production`, `revision` | `border-t-info-500` |
| Review | `in_review`, `client_review` | `border-t-success-500` |
| Termine | `approved`, `delivered` | `border-t-zinc-400` |

Chaque card du Kanban :

```vue
<!-- MarketingKanbanCard.vue -->
<Card class="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      @click="navigateTo(`/marketing/workflows/${workflow.id}`)">
  <!-- Thumbnail de la derniere version (si existe) -->
  <div v-if="latestVersion?.thumbnail_path"
       class="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-muted">
    <img :src="latestVersion.thumbnail_path"
         :alt="workflow.title"
         class="size-full object-cover transition-transform group-hover:scale-[1.02]" />
    <Badge class="absolute right-2 top-2" variant="secondary">
      v{{ latestVersion.version_number }}
    </Badge>
  </div>
  <!-- Contenu -->
  <CardContent class="p-3 space-y-2">
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-medium leading-tight line-clamp-2">{{ workflow.title }}</p>
      <MarketingPriorityDot :priority="workflow.priority" />
    </div>
    <div class="flex items-center justify-between">
      <MarketingDeadlineCountdown :deadline="workflow.deadline_at" size="sm" />
      <div v-if="unreadCommentCount > 0"
           class="flex items-center gap-1 text-xs text-primary">
        <MessageCircle class="size-3" />
        <span>{{ unreadCommentCount }}</span>
      </div>
    </div>
  </CardContent>
</Card>
```

### Toggle Kanban / Liste

Un SegmentedControl en haut a droite permet de basculer :

```vue
<div class="flex items-center gap-1 rounded-lg border bg-muted p-0.5">
  <button @click="view = 'kanban'"
          :class="view === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-all">
    <Columns3 class="mr-1.5 inline size-3.5" />
    Kanban
  </button>
  <button @click="view = 'list'"
          :class="view === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-all">
    <List class="mr-1.5 inline size-3.5" />
    Liste
  </button>
</div>
```

La vue liste reutilise le meme DataTable pattern que le manager, filtre sur `graphiste_id = auth.user.id`.

---

## 6. Workflow creatif modernise

### Remplacement des 5 onglets

Les 5 onglets legacy (Suivi, En cours, Avant, Apres, Stand by) sont remplaces par un systeme de **filtres combinables** sur la vue liste/kanban. Le mapping :

| Onglet legacy | Equivalent V2 |
|---------------|---------------|
| Suivi | Filtre statut = `brief_pending` |
| En cours | Filtre statut = `in_production` + `revision` |
| Avant | Filtre statut = `in_review` + `client_review` |
| Apres | Filtre statut = `approved` + `delivered` |
| Stand by | Filtre statut = `on_hold` |

Des **presets de filtres** (saved views) permettent de retrouver ces vues rapidement :

```vue
<div class="flex items-center gap-2 mb-4">
  <Button v-for="preset in filterPresets" :key="preset.key"
          :variant="activePreset === preset.key ? 'default' : 'outline'"
          size="sm"
          @click="applyPreset(preset.key)">
    {{ preset.label }}
    <Badge variant="secondary" class="ml-1.5">{{ preset.count }}</Badge>
  </Button>
</div>
```

### Flow du workflow

```
                    +-------------------+
                    |  brief_pending    |  <-- Manager cree/assigne
                    +--------+----------+
                             |
                    Graphiste commence
                             |
                    +--------v----------+
              +---->|  in_production    |  <-- Graphiste travaille
              |     +--------+----------+
              |              |
              |     Graphiste soumet v1
              |              |
              |     +--------v----------+
              |     |  in_review        |  <-- Manager valide
              |     +--------+----------+
              |              |
              |         +---------+
              |         | Valide? |
              |         +----+----+
              |          Non |    | Oui
              |              |    |
              |     +--------v--+ +------v-----------+
              |     |  revision | |  client_review   |
              |     +--------+--+ +------+-----------+
              |              |           |
              +----feedback---+     +---------+
                                    | Client? |
                                    +----+----+
                                   Non   |    Oui
                                    |    |
                              +-----v--+ +----v---------+
                              |revision| |  approved    |
                              +--------+ +----+---------+
                                              |
                                    +---------v---------+
                                    |    delivered       |
                                    +-------------------+
```

Chaque transition d'etat est declenchee par une action explicite, pas un changement automatique. Les actions sont des boutons dans le detail du workflow (voir section 7).

---

## 7. Detail d'un Marketing Workflow

### Layout de la page `/marketing/workflows/:id`

```
+------------------------------------------------------------------+
|  Breadcrumb: Marketing > Workflows > "Op. Leclerc Drive Printemps"|
+------------------------------------------------------------------+
|  Context Bar (sticky top)                                        |
|  [Status badge] [Priorite] [Deadline countdown]     [Actions v]  |
+------------------------------------------------------------------+
|  Grid 2 colonnes (60/40)                                         |
|  +-----------------------------------+ +------------------------+ |
|  | Panel principal                   | | Panel lateral          | |
|  |                                   | |                        | |
|  | Tabs: Brief | Versions | Historique| | Brief resume          | |
|  |                                   | | Graphiste assigne      | |
|  | [Contenu du tab actif]            | | DTSF                   | |
|  |                                   | | Contexte campagne      | |
|  |                                   | | (ciblage, audience)    | |
|  |                                   | |                        | |
|  +-----------------------------------+ +------------------------+ |
+------------------------------------------------------------------+
```

### Context Bar (sticky)

Pattern identique a `ContextBar.vue` des campaigns :

```vue
<div class="sticky top-[--header-height] z-10 flex items-center justify-between
            border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
  <div class="flex items-center gap-3">
    <MarketingStatusBadge :status="workflow.etat" />
    <MarketingPriorityBadge :priority="workflow.priority" />
    <MarketingDeadlineCountdown :deadline="workflow.deadline_at" />
  </div>
  <div class="flex items-center gap-2">
    <!-- Actions contextuelles selon statut et role -->
    <Button v-if="canSubmitForReview" @click="submitForReview">
      <Send class="mr-1.5 size-4" />
      {{ t('marketing.actions.submitReview') }}
    </Button>
    <Button v-if="canApprove" variant="default" @click="approve">
      <Check class="mr-1.5 size-4" />
      {{ t('marketing.actions.approve') }}
    </Button>
    <Button v-if="canRequestRevision" variant="outline" @click="openRevisionDialog">
      <RotateCcw class="mr-1.5 size-4" />
      {{ t('marketing.actions.requestRevision') }}
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon">
          <MoreHorizontal class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @click="reassign">
          {{ t('marketing.actions.reassign') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="putOnHold">
          {{ t('marketing.actions.onHold') }}
        </DropdownMenuItem>
        <DropdownMenuItem class="text-destructive" @click="cancel">
          {{ t('marketing.actions.cancel') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
```

### Tab "Versions"

C'est le coeur de l'experience. Il affiche toutes les versions uploadees, de la plus recente a la plus ancienne, avec le systeme de review integre.

```
+-------------------------------------------------------------+
|  Upload zone (drag & drop)                                  |
|  +-------------------------------------------------------+  |
|  | Glissez vos fichiers ici ou [parcourir]               |  |
|  | Images, PDF, HTML acceptes (max 50MB)                 |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
|  Version 3 (actuelle) -- il y a 2h -- par Lea              |
|  +-----------------------------+ +------------------------+ |
|  |     Preview inline          | | Commentaires (3)       | |
|  |     (image/PDF/HTML)        | | [x] Logo trop petit    | |
|  |                             | | [ ] Couleur OK         | |
|  |                             | | [ ] Typo "printemp"    | |
|  |     [Ouvrir en review]      | +------------------------+ |
|  +-----------------------------+ | Status: En review      | |
|  |  [Approuver] [Demander rev.] | [Telecharger]          | |
|  +-----------------------------+--+------------------------+ |
+-------------------------------------------------------------+
|  Version 2 -- 15 mars -- par Lea                            |
|  [thumbnail reduit] | Rejetee -- 2 commentaires resolus     |
+-------------------------------------------------------------+
|  Version 1 -- 12 mars -- par Lea                            |
|  [thumbnail reduit] | Rejetee -- 4 commentaires resolus     |
+-------------------------------------------------------------+
```

Chaque version ancienne est affichee en mode collapse (Accordion) pour ne pas encombrer, avec un thumbnail miniature et un resume du statut.

### Tab "Brief"

Voir section 10.

### Tab "Historique"

Timeline verticale de tous les evenements du workflow, pattern identique a `SectionTimeline.vue` des campaigns :

```
[Avatar] Sophie a cree le workflow                    12 mars 09:30
[Avatar] Sophie a assigne Lea                         12 mars 09:31
[Avatar] Lea a uploade la version 1                   12 mars 14:20
[Avatar] Sophie a ajoute 4 commentaires               13 mars 10:15
[Avatar] Sophie a demande une revision                 13 mars 10:16
[Avatar] Lea a uploade la version 2                   15 mars 11:00
[Avatar] Sophie a approuve la version 2                15 mars 14:30
[Avatar] Envoye au client pour validation              15 mars 14:31
```

---

## 8. Systeme de feedback et review

### Mode Review plein ecran (`/marketing/workflows/:id/review`)

Le mode review est un ecran dedie, en plein ecran (sans sidebar), optimise pour les annotations visuelles. Inspire de Figma Comments et Markup.io.

```
+------------------------------------------------------------------+
|  Barre d'outils review (sticky top)                              |
|  [< Retour] | v3 de 3 [< >] | Zoom [- 100% +] | [Annoter]     |
|  [Comparer v2/v3] | [Approuver] [Rejeter]                       |
+------------------------------------------------------------------+
|                                                                  |
|     Zone de preview (centree, zoomable, pannable)                |
|                                                                  |
|     +----------------------------------------------+             |
|     |                                              |             |
|     |          Creation affichee                   |             |
|     |                                              |             |
|     |    (1) [pin annotation]                      |             |
|     |                                              |             |
|     |              (2) [pin annotation]             |             |
|     |                                              |             |
|     +----------------------------------------------+             |
|                                                                  |
+------------------------------------------------------------------+
|  Panel commentaires (slide-in depuis la droite)                  |
|  +-------------------------------+                               |
|  | Thread #1 -- Logo             |                               |
|  |   Sophie: "Logo trop petit,   |                               |
|  |    min 120px de large"        |                               |
|  |   Lea: "Corrige en v3"       |                               |
|  |   [Resolu]                    |                               |
|  +-------------------------------+                               |
|  | Thread #2 -- Couleur fond     |                               |
|  |   Sophie: "Utiliser #FF6B35"  |                               |
|  |   [Non resolu]                |                               |
|  +-------------------------------+                               |
|  | [+ Nouveau commentaire]       |                               |
|  +-------------------------------+                               |
+------------------------------------------------------------------+
```

### Annotations visuelles

L'utilisateur clique sur la creation pour placer un pin. Un formulaire de commentaire s'ouvre inline.

**Interaction :**
1. L'utilisateur clique sur le bouton "Annoter" dans la toolbar (active le mode annotation)
2. Le curseur change en crosshair
3. L'utilisateur clique sur un point de la creation
4. Un pin numerote apparait a l'emplacement du clic
5. Un champ de commentaire s'ouvre, ancre au pin
6. L'utilisateur tape son commentaire et valide
7. Le pin reste visible, cliquable pour ouvrir le thread

**Composant AnnotationPin :**

```vue
<!-- MarketingAnnotationPin.vue -->
<template>
  <button
    class="absolute z-10 flex size-7 items-center justify-center rounded-full
           text-xs font-bold shadow-lg transition-transform hover:scale-110
           focus:outline-none focus:ring-2 focus:ring-ring"
    :class="resolved
      ? 'bg-success-500 text-white'
      : 'bg-primary text-primary-foreground'"
    :style="{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }"
    @click="emit('select', id)">
    {{ number }}
  </button>
</template>
```

### Comparaison de versions

Le mode "Comparer" affiche deux versions cote a cote avec un slider vertical (before/after). Le composant utilise un `ResizeObserver` et un drag handle :

```
+-----------------------------+-----------------------------+
|  Version 2                  |  Version 3                  |
|                             |                             |
|                    <========|========>                    |
|                      drag handle                         |
|                             |                             |
+-----------------------------+-----------------------------+
```

Alternative : mode "onion skin" (superposition avec slider d'opacite) pour les images.

### Threads de commentaires

Chaque commentaire est lie a une version et optionnellement a des coordonnees (annotation). Les commentaires sans coordonnees sont des "commentaires generaux".

Structure d'un thread :

```vue
<!-- MarketingCommentThread.vue -->
<div class="space-y-3 rounded-lg border p-3"
     :class="comment.resolved_at ? 'opacity-60' : ''">
  <!-- Commentaire parent -->
  <div class="flex items-start gap-3">
    <Avatar class="size-7 shrink-0">
      <AvatarFallback class="text-[10px]">{{ authorInitials }}</AvatarFallback>
    </Avatar>
    <div class="flex-1 min-w-0 space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{{ comment.author_name }}</span>
        <Badge variant="outline" class="text-[10px] py-0">
          {{ t(`marketing.roles.${comment.author_role}`) }}
        </Badge>
        <span class="text-xs text-muted-foreground">{{ formatRelativeTime(comment.created_at) }}</span>
      </div>
      <p class="text-sm leading-relaxed">{{ comment.body }}</p>
    </div>
    <Button v-if="!comment.resolved_at && canResolve"
            variant="ghost" size="icon" class="size-7 shrink-0"
            @click="resolve(comment.id)">
      <Check class="size-3.5" />
    </Button>
  </div>

  <!-- Reponses -->
  <div v-for="reply in comment.replies" :key="reply.id"
       class="ml-10 flex items-start gap-3 border-l-2 border-border pl-3">
    <!-- Meme structure que le parent -->
  </div>

  <!-- Champ de reponse -->
  <div class="ml-10 flex items-start gap-2">
    <Input v-model="replyText" :placeholder="t('marketing.comments.replyPlaceholder')" class="flex-1" />
    <Button size="sm" :disabled="!replyText.trim()" @click="submitReply">
      {{ t('marketing.comments.reply') }}
    </Button>
  </div>
</div>
```

### Resolution des commentaires

Un commentaire peut etre marque comme "resolu" par le graphiste ou le manager. Les commentaires resolus sont visuellement attenues (opacite 60%) et filtrables.

Un compteur en haut de la zone de commentaires :

```vue
<div class="flex items-center justify-between mb-3">
  <span class="text-sm font-medium">
    {{ t('marketing.comments.title') }}
  </span>
  <div class="flex items-center gap-3 text-xs text-muted-foreground">
    <span>{{ resolvedCount }}/{{ totalCount }} {{ t('marketing.comments.resolved') }}</span>
    <button @click="toggleShowResolved" class="underline underline-offset-2">
      {{ showResolved ? t('marketing.comments.hideResolved') : t('marketing.comments.showResolved') }}
    </button>
  </div>
</div>
```

---

## 9. Integration fichiers et preview

### Upload

Le composant d'upload accepte drag & drop et selection manuelle. Il gere :
- Images : JPG, PNG, WebP, SVG (preview native)
- PDF : preview via PDF.js (premiere page en thumbnail, navigation entre pages)
- HTML : preview dans une iframe sandboxee (pour les landing pages et emailings)
- PSD/AI : pas de preview, affiche une icone de type fichier + nom

**Composant MarketingFileUploader :**

```vue
<template>
  <div
    class="relative rounded-xl border-2 border-dashed transition-colors"
    :class="isDragOver
      ? 'border-primary bg-primary/5'
      : 'border-border hover:border-primary/50'"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="handleDrop">

    <div class="flex flex-col items-center gap-3 py-8">
      <div class="rounded-full bg-muted p-3">
        <Upload class="size-6 text-muted-foreground" />
      </div>
      <div class="text-center">
        <p class="text-sm font-medium">
          {{ t('marketing.upload.dragDrop') }}
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ t('marketing.upload.formats') }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="openFilePicker">
        {{ t('marketing.upload.browse') }}
      </Button>
    </div>

    <!-- Progress overlay -->
    <div v-if="isUploading"
         class="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
      <div class="space-y-2 text-center">
        <div class="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <div class="h-full rounded-full bg-primary transition-all"
               :style="{ width: `${uploadProgress}%` }" />
        </div>
        <p class="text-xs text-muted-foreground">{{ uploadProgress }}%</p>
      </div>
    </div>
  </div>
</template>
```

### Preview inline

Le systeme de preview detecte le type de fichier et rend le composant adapte.

**Composant MarketingFilePreview :**

```vue
<template>
  <div class="relative overflow-hidden rounded-lg border bg-white">
    <!-- Image -->
    <img v-if="isImage" :src="fileUrl" :alt="fileName"
         class="max-h-[600px] w-full object-contain" />

    <!-- PDF -->
    <MarketingPdfViewer v-else-if="isPdf" :url="fileUrl" />

    <!-- HTML (iframe sandboxee) -->
    <iframe v-else-if="isHtml" :srcdoc="htmlContent"
            sandbox="allow-same-origin"
            class="h-[600px] w-full border-0" />

    <!-- Fichier non previewable -->
    <div v-else class="flex flex-col items-center gap-3 py-12">
      <FileIcon class="size-12 text-muted-foreground" />
      <p class="text-sm font-medium">{{ fileName }}</p>
      <p class="text-xs text-muted-foreground">{{ formatFileSize(fileSize) }}</p>
      <Button variant="outline" size="sm" @click="download">
        <Download class="mr-1.5 size-3.5" />
        {{ t('marketing.preview.download') }}
      </Button>
    </div>

    <!-- Overlay d'actions -->
    <div class="absolute bottom-3 right-3 flex items-center gap-2">
      <Button variant="secondary" size="sm" class="shadow-md" @click="openInReview">
        <Maximize2 class="mr-1.5 size-3.5" />
        {{ t('marketing.preview.fullscreen') }}
      </Button>
      <Button variant="secondary" size="icon" class="size-8 shadow-md" @click="download">
        <Download class="size-3.5" />
      </Button>
    </div>
  </div>
</template>
```

### PDF Viewer

Le `MarketingPdfViewer` utilise PDF.js pour rendre les pages avec navigation :

```vue
<template>
  <div class="flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" class="size-7" :disabled="currentPage <= 1"
                @click="currentPage--">
          <ChevronLeft class="size-4" />
        </Button>
        <span class="text-xs text-muted-foreground">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <Button variant="ghost" size="icon" class="size-7" :disabled="currentPage >= totalPages"
                @click="currentPage++">
          <ChevronRight class="size-4" />
        </Button>
      </div>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="size-7" @click="zoomOut">
          <ZoomOut class="size-4" />
        </Button>
        <span class="text-xs text-muted-foreground w-12 text-center">{{ zoom }}%</span>
        <Button variant="ghost" size="icon" class="size-7" @click="zoomIn">
          <ZoomIn class="size-4" />
        </Button>
      </div>
    </div>
    <!-- Canvas PDF -->
    <div class="flex-1 overflow-auto p-4">
      <canvas ref="pdfCanvas" class="mx-auto shadow-md" />
    </div>
  </div>
</template>
```

### Versioning des fichiers

Chaque upload cree une nouvelle version automatiquement. L'historique des versions est visible dans le tab "Versions" avec un resume :

```
v3 (actuelle)  |  flyer-leclerc-v3.jpg  |  2.4 MB  |  Lea  |  il y a 2h   |  [En review]
v2             |  flyer-leclerc-v2.jpg  |  2.1 MB  |  Lea  |  15 mars      |  [Rejetee]
v1             |  flyer-leclerc-v1.jpg  |  1.8 MB  |  Lea  |  12 mars      |  [Rejetee]
```

---

## 10. Brief enrichi

### Structure du brief

Le brief combine des informations structurees (metadonnees) et du texte libre (instructions creatives). Il est affiche dans le tab "Brief" du workflow detail.

```
+------------------------------------------------------------------+
|  Brief -- Operation Leclerc Drive Printemps                      |
+------------------------------------------------------------------+
|                                                                  |
|  Section 1 : Contexte campagne (auto-rempli depuis l'operation)  |
|  +------------------------------------------------------------+ |
|  | Type: Prospection SMS     | Audience: H/F 25-55 ans        | |
|  | Zone: Depts 77, 78, 91   | Volume estime: ~45 000          | |
|  | Landing page: Oui         | Date envoi: 28 mars 2026       | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  Section 2 : Objectif marketing                                 |
|  +------------------------------------------------------------+ |
|  | Promouvoir l'offre Drive Printemps avec -20% sur le premier | |
|  | panier. Mettre en avant la simplicite du service Drive.     | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  Section 3 : Livrables attendus                                 |
|  +------------------------------------------------------------+ |
|  | [x] SMS template (160 car.)                                 | |
|  | [x] Landing page (HTML responsive)                          | |
|  | [ ] Emailing                                                | |
|  | [ ] Visuel reseaux sociaux                                  | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  Section 4 : Charte graphique                                   |
|  +------------------------------------------------------------+ |
|  | Logo: [thumbnail logo Leclerc]                              | |
|  | Couleurs: #E30613 (rouge) #333333 (texte)                  | |
|  | Fichiers de reference: [kit-graphique.zip] [download]       | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  Section 5 : Contraintes & notes                                |
|  +------------------------------------------------------------+ |
|  | - Mentions legales obligatoires (CGV + CNIL)                | |
|  | - Ne pas utiliser le mot "gratuit" (regle partenaire)       | |
|  | - Format landing page : mobile-first (80% trafic mobile)    | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  Section 6 : DTSF                                               |
|  +------------------------------------------------------------+ |
|  | Date cible: 28 mars 2026                                   | |
|  | Frequence: Operation unique                                 | |
|  | Sequence: SMS > Landing Page > (pas d'email)               | |
|  +------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

### Composant BriefSection

Chaque section est un composant reutilisable :

```vue
<!-- MarketingBriefSection.vue -->
<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <component :is="icon" class="size-4 text-muted-foreground" />
      <h3 class="text-sm font-semibold">{{ title }}</h3>
    </div>
    <Card>
      <CardContent class="p-4">
        <slot />
      </CardContent>
    </Card>
  </div>
</template>
```

### Section "Contexte campagne" (auto-remplie)

Cette section est remplie automatiquement depuis les donnees de l'operation/campagne liee. Elle utilise des `Badge` variant="secondary" pour les metadonnees cle :

```vue
<MarketingBriefSection :icon="Target" :title="t('marketing.brief.context')">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <div class="space-y-1">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('marketing.brief.campaignType') }}
      </p>
      <Badge variant="secondary">{{ t(`campaigns.type.${campaign.type}`) }}</Badge>
    </div>
    <div class="space-y-1">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('marketing.brief.audience') }}
      </p>
      <p class="text-sm">{{ audienceLabel }}</p>
    </div>
    <div class="space-y-1">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('marketing.brief.zone') }}
      </p>
      <div class="flex flex-wrap gap-1">
        <Badge v-for="zone in targetingZones.slice(0, 4)" :key="zone" variant="outline">
          {{ zone }}
        </Badge>
        <Badge v-if="targetingZones.length > 4" variant="outline">
          +{{ targetingZones.length - 4 }}
        </Badge>
      </div>
    </div>
    <div class="space-y-1">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('marketing.brief.volume') }}
      </p>
      <p class="text-sm font-medium">~{{ formatNumber(campaign.volume_estimated) }}</p>
    </div>
    <div class="space-y-1">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('marketing.brief.sendDate') }}
      </p>
      <p class="text-sm">{{ formatDate(campaign.scheduled_at) }}</p>
    </div>
    <div class="space-y-1">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('marketing.brief.landingPage') }}
      </p>
      <Badge :variant="campaign.landing_page_id ? 'default' : 'outline'">
        {{ campaign.landing_page_id ? t('common.yes') : t('common.no') }}
      </Badge>
    </div>
  </div>
</MarketingBriefSection>
```

### Livrables (checklist)

Les livrables sont definis par le manager lors de la creation du brief. Le graphiste voit la checklist et peut cocher quand un livrable est uploade :

```vue
<MarketingBriefSection :icon="CheckSquare" :title="t('marketing.brief.deliverables')">
  <div class="space-y-2">
    <div v-for="deliverable in brief.deliverables" :key="deliverable.id"
         class="flex items-center gap-3 rounded-md p-2"
         :class="deliverable.completed ? 'bg-success-50' : ''">
      <Checkbox :model-value="deliverable.completed" :disabled="!isGraphiste"
                @update:model-value="toggleDeliverable(deliverable.id, $event)" />
      <span class="text-sm" :class="deliverable.completed ? 'line-through text-muted-foreground' : ''">
        {{ deliverable.label }}
      </span>
      <Badge v-if="deliverable.version_id" variant="outline" class="ml-auto text-[10px]">
        v{{ deliverable.version_number }}
      </Badge>
    </div>
  </div>
</MarketingBriefSection>
```

---

## 11. Notifications creatives

### Matrice de notifications

| Evenement | Graphiste | Manager | Client |
|-----------|-----------|---------|--------|
| Nouveau brief assigne | In-app + email | -- | -- |
| Brief modifie | In-app | -- | -- |
| Creation uploadee (nouvelle version) | -- | In-app | -- |
| Commentaire/feedback recu | In-app (toast) | In-app (toast) | Email |
| Revision demandee | In-app + email | -- | -- |
| Creation approuvee par manager | In-app | -- | -- |
| Envoyee au client | -- | In-app | Email |
| Client a valide | In-app | In-app + email | -- |
| Client a demande revision | In-app + email | In-app | -- |
| Deadline dans 24h | In-app | In-app | -- |
| Deadline depassee | -- | In-app + email | -- |
| Client sans reponse depuis 48h | -- | In-app | Email (relance auto) |
| Workflow termine | In-app | In-app | -- |

### Implementation in-app

Les notifications in-app utilisent deux mecanismes :

**1. Toasts temps reel (vue-sonner, deja installe)** pour les evenements immediats :

```typescript
// Dans un composable useMarketingNotifications.ts
export function useMarketingNotifications() {
  const echo = useEcho() // Laravel Echo deja configure

  onMounted(() => {
    echo.private(`marketing.user.${auth.user.id}`)
      .listen('.comment.created', (e: MarketingCommentEvent) => {
        toast(t('marketing.notifications.newComment', { author: e.author_name }), {
          description: truncate(e.body, 80),
          action: {
            label: t('marketing.notifications.view'),
            onClick: () => navigateTo(`/marketing/workflows/${e.workflow_id}`),
          },
        })
      })
      .listen('.version.uploaded', (e: MarketingVersionEvent) => {
        toast(t('marketing.notifications.newVersion', { title: e.workflow_title }))
      })
      .listen('.status.changed', (e: MarketingStatusEvent) => {
        // Refresh les compteurs sidebar
        refreshPendingCount()
      })
  })
}
```

**2. Centre de notifications** (popover dans le header, icone Bell) :

```vue
<!-- Dans AppHeader.vue, ajouter a cote du ThemeSwitcher -->
<Popover>
  <PopoverTrigger as-child>
    <Button variant="ghost" size="icon" class="relative">
      <Bell class="size-4" />
      <span v-if="unreadCount > 0"
            class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center
                   rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" class="w-96 p-0">
    <div class="border-b px-4 py-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">{{ t('notifications.title') }}</h3>
        <Button v-if="unreadCount > 0" variant="ghost" size="sm" @click="markAllRead">
          {{ t('notifications.markAllRead') }}
        </Button>
      </div>
    </div>
    <div class="max-h-96 overflow-y-auto">
      <button v-for="notif in notifications" :key="notif.id"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              :class="!notif.read_at ? 'bg-primary/5' : ''"
              @click="handleNotificationClick(notif)">
        <div class="mt-0.5 flex size-8 items-center justify-center rounded-full"
             :class="notifIconBg(notif.type)">
          <component :is="notifIcon(notif.type)" class="size-3.5" />
        </div>
        <div class="flex-1 min-w-0 space-y-0.5">
          <p class="text-sm leading-tight" :class="!notif.read_at ? 'font-medium' : ''">
            {{ notif.message }}
          </p>
          <p class="text-xs text-muted-foreground">{{ formatRelativeTime(notif.created_at) }}</p>
        </div>
        <div v-if="!notif.read_at" class="mt-2 size-2 shrink-0 rounded-full bg-primary" />
      </button>
    </div>
  </PopoverContent>
</Popover>
```

### Relances client automatiques

Le systeme envoie automatiquement des emails de relance quand un workflow est en `client_review` et que le client n'a pas reagi. Configuration :

- Premiere relance : 48h apres envoi au client
- Deuxieme relance : 96h (4 jours)
- Escalade au manager : 7 jours (notification specifique "Client sans reponse depuis 7 jours")

Le manager voit un indicateur visuel dans le tableau :

```vue
<!-- Dans la cellule "Statut" du tableau quand etat = client_review -->
<div class="flex items-center gap-1.5">
  <MarketingStatusBadge :status="workflow.etat" />
  <Tooltip v-if="daysSinceClientReview > 2">
    <TooltipTrigger>
      <Clock class="size-3.5"
             :class="daysSinceClientReview > 7 ? 'text-error-500' : 'text-warning-500'" />
    </TooltipTrigger>
    <TooltipContent>
      {{ t('marketing.clientWaiting', { days: daysSinceClientReview }) }}
    </TooltipContent>
  </Tooltip>
</div>
```

---

## 12. Tokens et composants specifiques

### MarketingStatusBadge

Meme pattern que `CampaignStatusBadge.vue` :

```typescript
type MarketingStatus =
  | 'brief_pending' | 'in_production' | 'in_review'
  | 'client_review' | 'revision' | 'approved'
  | 'delivered' | 'on_hold' | 'cancelled'

const STATUS_MAP: Record<MarketingStatus, { bg: string, text: string, border: string }> = {
  brief_pending:  { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  in_production:  { bg: 'bg-info-100', text: 'text-info-700', border: 'border-info-500/30' },
  in_review:      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500/30' },
  client_review:  { bg: 'bg-chart-4/15', text: 'text-chart-4', border: 'border-chart-4/30' },
  revision:       { bg: 'bg-orange-200', text: 'text-orange-800', border: 'border-orange-500/40' },
  approved:       { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-500/30' },
  delivered:      { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-500/30' },
  on_hold:        { bg: 'bg-zinc-200', text: 'text-zinc-700', border: 'border-zinc-400' },
  cancelled:      { bg: 'bg-zinc-200', text: 'text-zinc-700', border: 'border-zinc-400' },
}
```

### MarketingPriorityBadge

```typescript
const PRIORITY_MAP = {
  low:    { bg: 'bg-zinc-100', text: 'text-zinc-600', label: 'Basse' },
  medium: { bg: 'bg-info-100', text: 'text-info-700', label: 'Moyenne' },
  high:   { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Haute' },
  urgent: { bg: 'bg-error-100', text: 'text-error-700', label: 'Urgente' },
}
```

### MarketingPriorityDot

Micro-composant pour les cards Kanban (juste un dot colore) :

```vue
<template>
  <Tooltip>
    <TooltipTrigger>
      <span class="inline-block size-2 rounded-full"
            :class="dotClass" />
    </TooltipTrigger>
    <TooltipContent>{{ label }}</TooltipContent>
  </Tooltip>
</template>
```

### MarketingDeadlineCountdown

Affiche le temps restant avec une urgence visuelle :

```vue
<template>
  <span class="inline-flex items-center gap-1 text-xs"
        :class="urgencyClass">
    <Clock class="size-3" />
    <span>{{ label }}</span>
  </span>
</template>

<script setup>
const urgencyClass = computed(() => {
  if (isOverdue.value) return 'text-error-600 font-semibold'
  if (hoursLeft.value < 24) return 'text-error-500'
  if (daysLeft.value <= 3) return 'text-warning-600'
  return 'text-muted-foreground'
})

const label = computed(() => {
  if (isOverdue.value) return t('marketing.deadline.overdue', { days: Math.abs(daysLeft.value) })
  if (hoursLeft.value < 24) return t('marketing.deadline.hours', { hours: hoursLeft.value })
  return t('marketing.deadline.days', { days: daysLeft.value })
})
</script>
```

### Couleurs additionnelles

Les couleurs existantes dans `main.css` couvrent tous les besoins :
- `chart-4` (oklch 0.720 0.160 330, violet/magenta) est utilise pour `client_review` -- un etat visuellement distinct des etats internes
- Les `orange-*` sont utilises pour `in_review` et `revision` -- proches du primaire mais differents
- Pas besoin de nouveaux tokens de couleur

---

## 13. Types TypeScript

Fichier `types/marketing.ts` a creer :

```typescript
import type { Component } from 'vue'

// --- Enums ---

export type MarketingStatus =
  | 'brief_pending'
  | 'in_production'
  | 'in_review'
  | 'client_review'
  | 'revision'
  | 'approved'
  | 'delivered'
  | 'on_hold'
  | 'cancelled'

export type MarketingPriority = 'low' | 'medium' | 'high' | 'urgent'

export type VersionStatus = 'pending' | 'in_review' | 'approved' | 'rejected'

export type CommentAuthorRole = 'graphiste' | 'manager' | 'client'

export type DeliverableType = 'sms_template' | 'landing_page' | 'emailing' | 'social_visual' | 'other'

// --- Models ---

export interface MarketingWorkflowRow {
  id: number
  operation_id: number | null
  partner_id: number
  title: string
  etat: MarketingStatus
  priority: MarketingPriority
  graphiste_id: number | null
  charge_marketing_id: number | null
  deadline_at: string | null
  started_at: string | null
  completed_at: string | null
  latest_version_thumbnail: string | null
  latest_version_number: number | null
  unread_comment_count: number
  created_at: string
}

export interface MarketingWorkflowDetail extends MarketingWorkflowRow {
  brief_text: string | null
  brief_context: BriefContext | null
  dtsf: DTSF | null
  versions: MarketingVersion[]
  graphiste: { id: number, full_name: string, initials: string } | null
  charge_marketing: { id: number, full_name: string, initials: string } | null
  operation: { id: number, name: string, campaign_type: string } | null
}

export interface BriefContext {
  campaign_type: string | null
  audience_label: string | null
  targeting_zones: string[]
  volume_estimated: number | null
  send_date: string | null
  has_landing_page: boolean
  objective: string | null
  deliverables: BriefDeliverable[]
  brand_colors: string[]
  brand_logo_url: string | null
  reference_files: BriefFile[]
  constraints: string[]
}

export interface BriefDeliverable {
  id: string
  type: DeliverableType
  label: string
  completed: boolean
  version_id: number | null
  version_number: number | null
}

export interface BriefFile {
  name: string
  url: string
  size: number
}

export interface DTSF {
  date: string | null
  time: string | null
  sequence: string | null
  frequency: string | null
}

export interface MarketingVersion {
  id: number
  workflow_id: number
  version_number: number
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  thumbnail_path: string | null
  uploaded_by: number
  uploader_name: string
  status: VersionStatus
  comments: MarketingComment[]
  created_at: string
}

export interface MarketingComment {
  id: number
  workflow_id: number
  version_id: number | null
  author_id: number
  author_name: string
  author_initials: string
  author_role: CommentAuthorRole
  body: string
  annotation: AnnotationCoords | null
  resolved_at: string | null
  resolved_by: number | null
  parent_id: number | null
  replies: MarketingComment[]
  created_at: string
}

export interface AnnotationCoords {
  x: number       // pourcentage (0-100) depuis la gauche
  y: number       // pourcentage (0-100) depuis le haut
  page?: number   // pour les PDF multi-pages
}

// --- Dashboard ---

export interface MarketingDashboardStats {
  brief_pending_count: number
  in_production_count: number
  in_review_count: number
  overdue_count: number
}

export interface GraphisteWorkload {
  user_id: number
  full_name: string
  initials: string
  brief_pending: number
  in_production: number
  in_review: number
  revision: number
  on_hold: number
  total: number
}

export interface UpcomingDeadline {
  id: number
  title: string
  deadline_at: string
  etat: MarketingStatus
  graphiste_name: string
  graphiste_initials: string
}

// --- Filters ---

export interface MarketingFilters {
  search: string
  statuses: MarketingStatus[]
  graphiste_id: number | null
  priority: MarketingPriority | null
  deadline_from: string
  deadline_to: string
}

// --- Kanban ---

export interface KanbanColumn {
  key: string
  label: string
  statuses: MarketingStatus[]
  borderColor: string
  items: MarketingWorkflowRow[]
}

// --- Notifications ---

export type MarketingNotificationType =
  | 'brief_assigned'
  | 'brief_updated'
  | 'version_uploaded'
  | 'comment_received'
  | 'revision_requested'
  | 'approved'
  | 'client_sent'
  | 'client_approved'
  | 'client_revision'
  | 'deadline_approaching'
  | 'deadline_overdue'
  | 'client_no_response'
  | 'workflow_completed'

export interface MarketingNotification {
  id: number
  type: MarketingNotificationType
  workflow_id: number
  message: string
  read_at: string | null
  created_at: string
}

export interface MarketingPagination {
  page: number
  lastPage: number
  total: number
}
```

---

## 14. Composants Vue -- specifications

### Arborescence des fichiers

```
app/components/marketing/
  dashboard/
    MarketingDashboardManager.vue      # Dashboard vue manager
    MarketingDashboardGraphiste.vue     # Dashboard vue graphiste
    MarketingKpiGrid.vue               # 4 KPI cards
    MarketingWorkloadChart.vue          # Charge par graphiste (bar chart)
    MarketingDeadlineTimeline.vue       # Timeline deadlines proches
    MarketingKanbanBoard.vue           # Kanban 4 colonnes
    MarketingKanbanColumn.vue          # Colonne du kanban
    MarketingKanbanCard.vue            # Card dans le kanban
    MarketingViewToggle.vue            # Toggle kanban/liste
  list/
    MarketingWorkflowTable.vue         # DataTable des workflows
    MarketingWorkflowFilters.vue       # Filtres (search, status, graphiste, etc.)
    MarketingFilterPresets.vue         # Boutons presets (remplace les 5 onglets)
    MarketingBatchActions.vue          # Barre d'actions batch
  detail/
    MarketingWorkflowDetail.vue        # Layout principal du detail
    MarketingContextBar.vue            # Barre sticky avec statut + actions
    MarketingTabBrief.vue              # Tab brief
    MarketingTabVersions.vue           # Tab versions
    MarketingTabHistory.vue            # Tab historique
    MarketingBriefSection.vue          # Section reutilisable du brief
    MarketingBriefContext.vue          # Section contexte campagne (auto-remplie)
    MarketingBriefDeliverables.vue     # Checklist livrables
  versions/
    MarketingVersionCard.vue           # Card d'une version (preview + meta)
    MarketingVersionHistory.vue        # Liste des anciennes versions (accordeon)
    MarketingFileUploader.vue          # Zone upload drag & drop
    MarketingFilePreview.vue           # Preview inline (image/PDF/HTML/fallback)
    MarketingPdfViewer.vue             # Viewer PDF avec navigation
  review/
    MarketingReviewScreen.vue          # Ecran review plein ecran
    MarketingReviewToolbar.vue         # Toolbar (zoom, version switch, actions)
    MarketingAnnotationLayer.vue       # Couche d'annotations sur la preview
    MarketingAnnotationPin.vue         # Pin numerote cliquable
    MarketingAnnotationForm.vue        # Formulaire inline pour annoter
    MarketingVersionCompare.vue        # Comparaison cote a cote / slider
  comments/
    MarketingCommentThread.vue         # Thread de commentaire (parent + reponses)
    MarketingCommentList.vue           # Liste des threads avec filtre resolu/non resolu
    MarketingCommentInput.vue          # Champ de saisie avec mention (@)
  shared/
    MarketingStatusBadge.vue           # Badge statut marketing
    MarketingPriorityBadge.vue         # Badge priorite
    MarketingPriorityDot.vue           # Dot priorite pour kanban
    MarketingDeadlineCountdown.vue     # Countdown deadline

app/composables/
  useMarketingWorkflows.ts             # CRUD + filtres + pagination
  useMarketingWorkflowDetail.ts        # Detail + versions + commentaires
  useMarketingDashboard.ts             # Stats + charge + deadlines
  useMarketingNotifications.ts         # Temps reel (Echo) + centre notifs
  useMarketingReview.ts                # Mode review (annotations, zoom, compare)
  useMarketingUpload.ts                # Upload fichiers + progress
  useMarketingKanban.ts                # Logique kanban (colonnes, drag, reorder)

app/stores/
  marketingFilters.ts                  # Persistence des filtres et vue active (Pinia)

app/pages/
  marketing/
    index.vue                          # Dashboard (detecte role)
    workflows/
      index.vue                        # Liste / Kanban
      [id].vue                         # Detail workflow
      [id]/
        review.vue                     # Mode review plein ecran (layout: 'blank')

app/types/
  marketing.ts                         # (cf. section 13)
```

### Page marketing/index.vue (detecte le role)

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import MarketingDashboardManager from '@/components/marketing/dashboard/MarketingDashboardManager.vue'
import MarketingDashboardGraphiste from '@/components/marketing/dashboard/MarketingDashboardGraphiste.vue'

const auth = useAuthStore()

const isManager = computed(() =>
  auth.hasPermission('manage marketing-workflows')
)
</script>

<template>
  <MarketingDashboardManager v-if="isManager" />
  <MarketingDashboardGraphiste v-else />
</template>
```

### Page review.vue (layout blank)

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'blank',  // Pas de sidebar, plein ecran
})
</script>

<template>
  <MarketingReviewScreen :workflow-id="Number($route.params.id)" />
</template>
```

Cela necessite un nouveau layout `layouts/blank.vue` :

```vue
<template>
  <main class="h-screen overflow-hidden">
    <slot />
  </main>
</template>
```

---

## 15. Responsive et accessibilite

### Breakpoints

| Composant | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|-------------------|
| Dashboard KPI | 1 colonne stack | 2 colonnes | 4 colonnes |
| Kanban | 1 colonne swipable | 2 colonnes | 4 colonnes |
| Workflow detail | Tabs empiles, panel lateral sous le principal | Grid 60/40 | Grid 60/40 |
| Review screen | Preview plein ecran, commentaires en sheet bottom | Split 70/30 | Split 75/25 |
| Version compare | Stack vertical | Cote a cote | Cote a cote |
| Filtres | Sheet bottom avec bouton "Filtrer" | Inline | Inline |
| Batch actions | Fixed bottom bar | Inline au-dessus du tableau | Inline au-dessus du tableau |

### Kanban mobile

Sur mobile, le kanban affiche une seule colonne a la fois avec des onglets horizontaux scrollables :

```vue
<div class="flex gap-2 overflow-x-auto pb-2 sm:hidden">
  <button v-for="col in columns" :key="col.key"
          class="shrink-0 rounded-full px-3 py-1.5 text-sm"
          :class="activeColumn === col.key
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'"
          @click="activeColumn = col.key">
    {{ col.label }}
    <span class="ml-1">{{ col.items.length }}</span>
  </button>
</div>
```

### Accessibilite (WCAG 2.1 AA)

**Annotations visuelles :**
- Les pins ont un `aria-label` descriptif : "Annotation 3 : Logo trop petit -- Non resolu"
- Les pins sont navigables au clavier (Tab) dans l'ordre numerique
- Un raccourci `Escape` quitte le mode annotation
- La couleur n'est jamais le seul indicateur (les pins resolus ont aussi une icone check)

**Kanban :**
- Chaque colonne a un `role="region"` et un `aria-label` avec le nom et le compteur
- Les cards sont des `role="article"` avec `aria-label` incluant titre, priorite, deadline
- Navigation clavier : Tab entre cards, Enter pour ouvrir

**Formulaires :**
- Tous les champs de commentaire ont des `aria-label` explicites
- Les boutons d'action ont des labels descriptifs (pas juste des icones)
- Les toasts de notification utilisent `role="status"` (deja gere par vue-sonner)

**Couleurs :**
- Tous les couples couleur de fond / couleur de texte des badges respectent un ratio de contraste >= 4.5:1
- Les indicateurs de deadline combinent couleur + texte (pas juste un dot rouge)
- Le mode sombre est supporte via les tokens CSS existants (`.dark`)

**Focus management :**
- Ouverture du mode review : focus place sur le premier element interactif
- Fermeture d'un dialog : focus restaure sur l'element declencheur
- Navigation entre versions (< >) : focus maintenu sur les fleches

---

## 16. Plan d'implementation

### Phase 1 -- Fondations (1 semaine)

**Backend :**
- Migration : tables `marketing_workflows`, `marketing_versions`, `marketing_comments`
- Modeles Eloquent avec relations
- Enum `MarketingStatus` (backed enum PHP)
- Policies et permissions (`view marketing-workflows`, `manage marketing-workflows`)
- CRUD API endpoints

**Frontend :**
- Types TypeScript (`types/marketing.ts`)
- Composants shared : `MarketingStatusBadge`, `MarketingPriorityBadge`, `MarketingPriorityDot`, `MarketingDeadlineCountdown`
- Navigation sidebar (ajout du groupe "Production")
- Layout `blank.vue`
- Pages vides (`marketing/index.vue`, `marketing/workflows/index.vue`, etc.)

### Phase 2 -- Dashboard + Liste (1 semaine)

**Backend :**
- Endpoint stats dashboard (`GET /marketing/dashboard`)
- Endpoint liste workflows avec filtres Spatie QueryBuilder
- Endpoint charge par graphiste

**Frontend :**
- `MarketingDashboardManager` avec KPI grid, workload chart, deadline timeline
- `MarketingDashboardGraphiste` avec quick stats, kanban board
- `MarketingWorkflowTable` + `MarketingWorkflowFilters` + `MarketingFilterPresets`
- `MarketingKanbanBoard` + cards
- Composables : `useMarketingDashboard`, `useMarketingWorkflows`, `useMarketingKanban`
- Store : `marketingFilters`

### Phase 3 -- Detail workflow + Brief (1 semaine)

**Backend :**
- Endpoint detail workflow avec includes (versions, comments, operation)
- Endpoint update brief
- Transitions d'etat (state machine dans un service)

**Frontend :**
- `MarketingWorkflowDetail` avec tabs (Brief, Versions, Historique)
- `MarketingContextBar` avec actions contextuelles
- Brief enrichi : `MarketingBriefContext`, `MarketingBriefDeliverables`, `MarketingBriefSection`
- `MarketingTabHistory` (timeline)

### Phase 4 -- Upload + Preview + Versioning (1 semaine)

**Backend :**
- Endpoint upload fichier + creation version automatique
- Generation de thumbnails (intervention/image pour images, pdftoimage pour PDF)
- Endpoint download fichier

**Frontend :**
- `MarketingFileUploader` (drag & drop, progress)
- `MarketingFilePreview` (image, PDF, HTML, fallback)
- `MarketingPdfViewer` (PDF.js)
- `MarketingVersionCard` + `MarketingVersionHistory`
- Composable : `useMarketingUpload`

### Phase 5 -- Feedback + Annotations (1 semaine)

**Backend :**
- CRUD commentaires avec support parent_id (threads)
- Stockage coordonnees annotation (JSON)
- Endpoint resolve/unresolve commentaire
- Broadcasting events (Laravel Echo)

**Frontend :**
- `MarketingCommentThread` + `MarketingCommentList` + `MarketingCommentInput`
- Mode review : `MarketingReviewScreen`, `MarketingReviewToolbar`, `MarketingAnnotationLayer`, `MarketingAnnotationPin`
- Comparaison versions : `MarketingVersionCompare`
- Composables : `useMarketingReview`, `useMarketingWorkflowDetail`

### Phase 6 -- Notifications + Polish (1 semaine)

**Backend :**
- Notifications Laravel (database + mail)
- Relances client automatiques (scheduled command)
- Broadcasting via Echo pour temps reel

**Frontend :**
- Centre de notifications (popover header)
- Composable `useMarketingNotifications` (Echo listeners)
- Badge sidebar avec compteur
- Batch actions dans le tableau
- Responsive final + tests d'accessibilite
- Tests Vitest pour tous les composants

---

## Annexe A : Correspondance fichiers existants / patterns reutilises

| Pattern existant | Fichier source | Reutilise pour |
|------------------|----------------|----------------|
| KPI Card avec tone | `DashboardKpiCard.vue` | `MarketingKpiGrid.vue` |
| DataTable triable | `CampaignDataTable.vue` | `MarketingWorkflowTable.vue` |
| Status Badge | `CampaignStatusBadge.vue` | `MarketingStatusBadge.vue` |
| Context Bar sticky | `detail/ContextBar.vue` | `MarketingContextBar.vue` |
| Timeline verticale | `detail/SectionTimeline.vue` | `MarketingTabHistory.vue` |
| Filtres multi-select | `CampaignMultiStatusFilter.vue` | `MarketingWorkflowFilters.vue` |
| EmptyState | `shared/EmptyState.vue` | Reutilise directement |
| PageSkeleton | `shared/PageSkeleton.vue` | Reutilise directement |
| Wizard stepper visual | `wizard/WizardStepper.vue` | Inspire `MarketingReviewToolbar` (version nav) |
| Accordion collapse | `ui/accordion/` | `MarketingVersionHistory.vue` (anciennes versions) |
| AlertDialog confirm | `ui/alert-dialog/` | Confirmation changements de statut |
| Sheet mobile | `ui/sheet/` | Filtres mobile, commentaires mobile |

## Annexe B : Tokens de couleur utilises

Tous les tokens proviennent du `main.css` existant. Aucun nouveau token n'est necessaire.

| Usage | Token | Valeur |
|-------|-------|--------|
| brief_pending | `--color-warning-500` | oklch(0.850 0.165 95) |
| in_production | `--color-info-500` | oklch(0.623 0.214 259) |
| in_review | `--color-orange-500` | oklch(0.750 0.170 70) |
| client_review | `--color-chart-4` | oklch(0.720 0.160 330) |
| revision | `--color-orange-600` | oklch(0.680 0.165 60) |
| approved/delivered | `--color-success-500` | oklch(0.723 0.191 149) |
| on_hold/cancelled | `--color-zinc-400` | oklch(0.707 0.015 286) |
| overdue | `--color-error-500` | oklch(0.645 0.246 16) |
| urgent priority | `--color-error-100/700` | oklch(0.940 0.050 25) / oklch(0.505 0.200 20) |
