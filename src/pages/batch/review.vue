<script setup lang="ts">
import { Check, CheckCheck, ChevronDown, ChevronUp, Eye, Loader2, Pencil, X } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

definePageMeta({
  title: 'Batch Review',
})

const api = useApi()
const { showToast } = useToast()

interface Modification {
  description: string
  priority: 'high' | 'medium' | 'low'
  supportedBy: string[]
  status?: string
}

interface BriefData {
  id: number
  sector: string
  slug: string
  title: string | null
  contentId: number | null
  avgScore: number | null
  totalMods: number
  acceptedCount: number
  hasHumanReview: boolean
  vote: string
  humanReview: string
}

interface ConsensusData {
  overallScore: number
  acceptedModifications?: Modification[]
  modifications?: Modification[]
  rejectedModifications?: Modification[]
}

interface ReviewAction {
  index: number
  action: 'accept' | 'reject' | 'edit'
  editedDescription?: string
}

const isLoading = ref(true)
const error = ref<string | null>(null)
const briefs = ref<BriefData[]>([])
const runId = ref<number | null>(null)
const phase = ref('')

// Per-brief state
const expandedBriefs = ref<Set<number>>(new Set())
const consensusCache = ref<Map<number, ConsensusData>>(new Map())
const reviewActions = ref<Map<number, ReviewAction[]>>(new Map())
const editingMod = ref<{ briefId: number, index: number } | null>(null)
const editText = ref('')
const savingBriefs = ref<Set<number>>(new Set())
const loadingConsensus = ref<Set<number>>(new Set())

async function loadBatchState(): Promise<void> {
  isLoading.value = true
  error.value = null
  try {
    const data = await api.get<{
      runId: number
      phase: string
      briefs: BriefData[]
    }>('/api/v1/batch')
    briefs.value = data.briefs
    runId.value = data.runId
    phase.value = data.phase
  }
  catch {
    error.value = 'Impossible de charger le batch'
  }
  finally {
    isLoading.value = false
  }
}

async function loadConsensus(briefId: number): Promise<void> {
  if (consensusCache.value.has(briefId))
    return
  loadingConsensus.value.add(briefId)
  try {
    const data = await api.get<{ consensus: ConsensusData }>(`/api/v1/batch/${briefId}/consensus`)
    consensusCache.value.set(briefId, data.consensus)

    // Init review actions from consensus
    const mods = data.consensus.acceptedModifications || data.consensus.modifications || []
    if (!reviewActions.value.has(briefId)) {
      reviewActions.value.set(briefId, mods.map((_: Modification, i: number) => ({
        index: i,
        action: 'accept' as const,
      })))
    }
  }
  catch {
    showToast('Erreur lors du chargement du consensus', 'error')
  }
  finally {
    loadingConsensus.value.delete(briefId)
  }
}

async function toggleBrief(briefId: number): Promise<void> {
  if (expandedBriefs.value.has(briefId)) {
    expandedBriefs.value.delete(briefId)
  }
  else {
    expandedBriefs.value.add(briefId)
    await loadConsensus(briefId)
  }
}

function getModifications(briefId: number): Modification[] {
  const consensus = consensusCache.value.get(briefId)
  if (!consensus)
    return []
  return consensus.acceptedModifications || consensus.modifications || []
}

function getRejectedModifications(briefId: number): Modification[] {
  const consensus = consensusCache.value.get(briefId)
  if (!consensus)
    return []
  return consensus.rejectedModifications || []
}

function getAction(briefId: number, index: number): ReviewAction {
  const actions = reviewActions.value.get(briefId) || []
  return actions[index] || { index, action: 'accept' }
}

function setAction(briefId: number, index: number, action: 'accept' | 'reject'): void {
  const actions = reviewActions.value.get(briefId) || []
  if (actions[index]) {
    actions[index].action = action
    delete actions[index].editedDescription
  }
}

function startEdit(briefId: number, index: number): void {
  const mods = getModifications(briefId)
  editingMod.value = { briefId, index }
  editText.value = mods[index]?.description || ''
}

function confirmEdit(): void {
  if (!editingMod.value)
    return
  const { briefId, index } = editingMod.value
  const actions = reviewActions.value.get(briefId) || []
  if (actions[index]) {
    actions[index].action = 'edit'
    actions[index].editedDescription = editText.value
  }
  editingMod.value = null
  editText.value = ''
}

function cancelEdit(): void {
  editingMod.value = null
  editText.value = ''
}

async function saveBriefReview(briefId: number): Promise<void> {
  savingBriefs.value.add(briefId)
  try {
    const actions = reviewActions.value.get(briefId) || []
    await api.post(`/api/v1/batch/${briefId}/review`, { modifications: actions })
    const brief = briefs.value.find(b => b.id === briefId)
    if (brief) {
      brief.hasHumanReview = true
      brief.humanReview = 'done'
    }
    showToast(`Brief #${briefId} validé`, 'success')
  }
  catch {
    showToast('Erreur lors de la sauvegarde', 'error')
  }
  finally {
    savingBriefs.value.delete(briefId)
  }
}

async function approveAll(): Promise<void> {
  const pending = briefs.value.filter(b => b.vote === 'done' && !b.hasHumanReview)
  for (const brief of pending) {
    if (!consensusCache.value.has(brief.id))
      await loadConsensus(brief.id)
    await saveBriefReview(brief.id)
  }
  showToast('Toutes les LP ont été approuvées', 'success')
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'var(--color-error)'
    case 'medium': return 'var(--color-warning, #f59e0b)'
    case 'low': return 'var(--color-success, #22c55e)'
    default: return 'var(--color-text-secondary)'
  }
}

function scoreColor(score: number | null): string {
  if (score === null)
    return 'var(--color-text-secondary)'
  if (score <= 4)
    return 'var(--color-error)'
  if (score <= 6.5)
    return 'var(--color-warning, #f59e0b)'
  return 'var(--color-success, #22c55e)'
}

const reviewableBriefs = computed(() =>
  briefs.value.filter(b => b.vote === 'done'),
)

const pendingCount = computed(() =>
  reviewableBriefs.value.filter(b => !b.hasHumanReview).length,
)

const doneCount = computed(() =>
  reviewableBriefs.value.filter(b => b.hasHumanReview).length,
)

onMounted(() => loadBatchState())
</script>

<template>
  <div class="batch-review">
    <header class="review-header">
      <div class="header-left">
        <h1>Batch Review</h1>
        <span v-if="runId" class="run-badge">Run #{{ runId }}</span>
        <span v-if="phase" class="phase-badge">{{ phase }}</span>
      </div>
      <div class="header-actions">
        <span class="review-count">{{ doneCount }}/{{ reviewableBriefs.length }} validées</span>
        <button
          class="btn btn-secondary"
          :disabled="pendingCount === 0"
          @click="approveAll"
        >
          <CheckCheck :size="16" />
          Tout approuver
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state" role="status">
      <Loader2 :size="32" class="animate-spin" />
      <p>Chargement du batch...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state" role="alert">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="loadBatchState">
        Réessayer
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="reviewableBriefs.length === 0" class="empty-state">
      <p>Aucune LP en attente de review. Le pipeline doit atteindre la phase "vote" d'abord.</p>
    </div>

    <!-- Brief cards -->
    <div v-else class="briefs-list">
      <div
        v-for="brief in reviewableBriefs"
        :key="brief.id"
        class="brief-card"
        :class="{ expanded: expandedBriefs.has(brief.id), reviewed: brief.hasHumanReview }"
      >
        <!-- Card header -->
        <div class="card-header" @click="toggleBrief(brief.id)">
          <div class="card-info">
            <span class="brief-id">#{{ brief.id }}</span>
            <span class="brief-title">{{ brief.title || brief.slug }}</span>
            <span class="brief-sector">{{ brief.sector }}</span>
          </div>
          <div class="card-meta">
            <span
              v-if="brief.avgScore !== null"
              class="score-badge"
              :style="{ color: scoreColor(brief.avgScore) }"
            >
              {{ brief.avgScore.toFixed(1) }}
            </span>
            <span class="mod-count">{{ brief.totalMods }} mods</span>
            <span v-if="brief.hasHumanReview" class="status-badge done">
              <Check :size="14" /> Validé
            </span>
            <span v-else class="status-badge pending">En attente</span>
            <component :is="expandedBriefs.has(brief.id) ? ChevronUp : ChevronDown" :size="18" />
          </div>
        </div>

        <!-- Expanded content -->
        <div v-if="expandedBriefs.has(brief.id)" class="card-content">
          <!-- Screenshot -->
          <div class="screenshot-section">
            <div class="screenshot-container">
              <img
                :src="`/api/v1/batch/${brief.id}/screenshot`"
                :alt="`Screenshot ${brief.slug}`"
                loading="lazy"
              >
              <span class="screenshot-label">Original</span>
            </div>
          </div>

          <!-- Loading consensus -->
          <div v-if="loadingConsensus.has(brief.id)" class="loading-inline">
            <Loader2 :size="16" class="animate-spin" />
            Chargement des modifications...
          </div>

          <!-- Modifications -->
          <template v-else-if="consensusCache.has(brief.id)">
            <h3>Modifications acceptées ({{ getModifications(brief.id).length }})</h3>
            <div class="modifications-list">
              <div
                v-for="(mod, idx) in getModifications(brief.id)"
                :key="idx"
                class="mod-item"
                :class="{ rejected: getAction(brief.id, idx).action === 'reject' }"
              >
                <div class="mod-header">
                  <span
                    class="priority-badge"
                    :style="{ backgroundColor: priorityColor(mod.priority) }"
                  >
                    {{ mod.priority }}
                  </span>
                  <span class="mod-supporters">
                    <span
                      v-for="reviewer in (mod.supportedBy || [])"
                      :key="reviewer"
                      class="reviewer-badge"
                    >
                      {{ reviewer }}
                    </span>
                  </span>
                </div>

                <!-- Edit mode -->
                <div v-if="editingMod?.briefId === brief.id && editingMod?.index === idx" class="mod-edit">
                  <textarea v-model="editText" rows="3" />
                  <div class="edit-actions">
                    <button class="btn btn-sm btn-primary" @click="confirmEdit">
                      <Check :size="14" /> OK
                    </button>
                    <button class="btn btn-sm btn-secondary" @click="cancelEdit">
                      Annuler
                    </button>
                  </div>
                </div>

                <!-- Display mode -->
                <template v-else>
                  <p class="mod-description">
                    {{ getAction(brief.id, idx).action === 'edit'
                      ? getAction(brief.id, idx).editedDescription
                      : mod.description }}
                    <span v-if="getAction(brief.id, idx).action === 'edit'" class="edited-tag">modifié</span>
                  </p>
                  <div class="mod-actions">
                    <button
                      class="btn btn-sm"
                      :class="getAction(brief.id, idx).action === 'accept' ? 'btn-primary' : 'btn-ghost'"
                      @click="setAction(brief.id, idx, 'accept')"
                    >
                      <Check :size="14" />
                    </button>
                    <button
                      class="btn btn-sm"
                      :class="getAction(brief.id, idx).action === 'reject' ? 'btn-danger' : 'btn-ghost'"
                      @click="setAction(brief.id, idx, 'reject')"
                    >
                      <X :size="14" />
                    </button>
                    <button
                      class="btn btn-sm btn-ghost"
                      @click="startEdit(brief.id, idx)"
                    >
                      <Pencil :size="14" />
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- Rejected modifications (info only) -->
            <details v-if="getRejectedModifications(brief.id).length > 0" class="rejected-section">
              <summary>Modifications rejetées par le consensus ({{ getRejectedModifications(brief.id).length }})</summary>
              <div class="modifications-list rejected-list">
                <div
                  v-for="(mod, idx) in getRejectedModifications(brief.id)"
                  :key="idx"
                  class="mod-item info-only"
                >
                  <span
                    class="priority-badge"
                    :style="{ backgroundColor: priorityColor(mod.priority) }"
                  >
                    {{ mod.priority }}
                  </span>
                  <p class="mod-description">
                    {{ mod.description }}
                  </p>
                </div>
              </div>
            </details>

            <!-- Save button -->
            <div class="card-footer">
              <button
                v-if="brief.contentId"
                class="btn btn-ghost"
                @click="navigateTo(`/lp/${brief.contentId}`)"
              >
                <Eye :size="16" /> Voir la LP
              </button>
              <button
                class="btn btn-primary"
                :disabled="savingBriefs.has(brief.id)"
                @click="saveBriefReview(brief.id)"
              >
                <Loader2 v-if="savingBriefs.has(brief.id)" :size="16" class="animate-spin" />
                <Check v-else :size="16" />
                {{ brief.hasHumanReview ? 'Mettre à jour' : 'Valider cette LP' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.batch-review {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.run-badge, .phase-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-bg-secondary, #f1f5f9);
  color: var(--color-text-secondary, #64748b);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-count {
  font-size: 14px;
  color: var(--color-text-secondary, #64748b);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.btn-secondary {
  background: var(--color-bg-secondary, #f1f5f9);
  color: var(--color-text, #1e293b);
}

.btn-danger {
  background: var(--color-error, #ef4444);
  color: white;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary, #64748b);
}

.btn-ghost:hover {
  background: var(--color-bg-secondary, #f1f5f9);
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 48px;
  color: var(--color-text-secondary, #64748b);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Brief cards */
.briefs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.brief-card {
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.brief-card.reviewed {
  border-color: var(--color-success, #22c55e);
}

.brief-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.card-header:hover {
  background: var(--color-bg-secondary, #f8fafc);
}

.card-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brief-id {
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text-secondary, #64748b);
}

.brief-title {
  font-weight: 600;
  font-size: 14px;
}

.brief-sector {
  font-size: 12px;
  color: var(--color-text-secondary, #64748b);
  background: var(--color-bg-secondary, #f1f5f9);
  padding: 1px 6px;
  border-radius: 3px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-badge {
  font-weight: 700;
  font-size: 14px;
}

.mod-count {
  font-size: 12px;
  color: var(--color-text-secondary, #64748b);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge.done {
  background: color-mix(in srgb, var(--color-success, #22c55e) 15%, transparent);
  color: var(--color-success, #22c55e);
}

.status-badge.pending {
  background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
  color: var(--color-warning, #f59e0b);
}

/* Card content */
.card-content {
  padding: 16px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.card-content h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.screenshot-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.screenshot-container {
  position: relative;
  width: 200px;
  flex-shrink: 0;
}

.screenshot-container img {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.screenshot-label {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 10px;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 3px;
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-size: 14px;
  color: var(--color-text-secondary, #64748b);
}

/* Modifications */
.modifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mod-item {
  padding: 10px 12px;
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: 6px;
  transition: opacity 0.15s;
}

.mod-item.rejected {
  opacity: 0.5;
}

.mod-item.info-only {
  opacity: 0.6;
}

.mod-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.priority-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 3px;
  color: white;
}

.reviewer-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--color-bg-secondary, #e2e8f0);
  color: var(--color-text-secondary, #64748b);
}

.mod-description {
  font-size: 13px;
  margin: 0 0 6px;
  line-height: 1.4;
}

.edited-tag {
  font-size: 10px;
  color: var(--color-primary, #3b82f6);
  font-style: italic;
  margin-left: 4px;
}

.mod-actions {
  display: flex;
  gap: 4px;
}

.mod-edit textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

.edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

/* Rejected section */
.rejected-section {
  margin-top: 12px;
}

.rejected-section summary {
  font-size: 13px;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
  padding: 4px 0;
}

.rejected-list {
  margin-top: 8px;
}

/* Card footer */
.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}
</style>
