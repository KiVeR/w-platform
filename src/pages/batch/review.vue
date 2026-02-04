<script setup lang="ts">
import { Check, ChevronDown, ChevronUp, Eye, Loader2, Send } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

definePageMeta({
  title: 'Batch Review',
})

const api = useApi()
const { showToast } = useToast()

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

const isLoading = ref(true)
const error = ref<string | null>(null)
const briefs = ref<BriefData[]>([])
const runId = ref<number | null>(null)
const phase = ref('')

// Per-brief state
const expandedBriefs = ref<Set<number>>(new Set())
const feedbackText = ref<Map<number, string>>(new Map())
const savingBriefs = ref<Set<number>>(new Set())

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

function toggleBrief(briefId: number): void {
  if (expandedBriefs.value.has(briefId)) {
    expandedBriefs.value.delete(briefId)
  }
  else {
    expandedBriefs.value.add(briefId)
  }
}

function getFeedback(briefId: number): string {
  return feedbackText.value.get(briefId) || ''
}

function setFeedback(briefId: number, value: string): void {
  feedbackText.value.set(briefId, value)
}

async function submitFeedback(briefId: number): Promise<void> {
  const feedback = getFeedback(briefId).trim()
  if (!feedback) {
    showToast('Veuillez écrire un retour', 'warning')
    return
  }

  savingBriefs.value.add(briefId)
  try {
    await api.post(`/api/v1/batch/${briefId}/review`, { feedback })
    const brief = briefs.value.find(b => b.id === briefId)
    if (brief) {
      brief.hasHumanReview = true
      brief.humanReview = 'done'
    }
    showToast(`Retour envoyé pour brief #${briefId}`, 'success')
  }
  catch {
    showToast('Erreur lors de l\'envoi', 'error')
  }
  finally {
    savingBriefs.value.delete(briefId)
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
        <span class="review-count">{{ doneCount }}/{{ reviewableBriefs.length }} avec retour</span>
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
            </div>

            <!-- Feedback form -->
            <div class="feedback-section">
              <label class="feedback-label">Votre retour</label>
              <textarea
                :value="getFeedback(brief.id)"
                placeholder="Décrivez les modifications souhaitées..."
                rows="5"
                class="feedback-textarea"
                @input="(e) => setFeedback(brief.id, (e.target as HTMLTextAreaElement).value)"
              />
              <div class="feedback-actions">
                <button
                  v-if="brief.contentId"
                  class="btn btn-ghost"
                  @click="navigateTo(`/lp/${brief.contentId}`)"
                >
                  <Eye :size="16" /> Voir la LP
                </button>
                <button
                  class="btn btn-primary"
                  :disabled="savingBriefs.has(brief.id) || !getFeedback(brief.id).trim()"
                  @click="submitFeedback(brief.id)"
                >
                  <Loader2 v-if="savingBriefs.has(brief.id)" :size="16" class="animate-spin" />
                  <Send v-else :size="16" />
                  Envoyer
                </button>
              </div>
            </div>
          </div>
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
  gap: 16px;
}

.screenshot-container {
  width: 280px;
  flex-shrink: 0;
}

.screenshot-container img {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e2e8f0);
}

/* Feedback section */
.feedback-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.feedback-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #3b82f6) 20%, transparent);
}

.feedback-textarea::placeholder {
  color: var(--color-text-secondary, #94a3b8);
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
