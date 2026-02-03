<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { MessageSquareQuote } from 'lucide-vue-next'
import { computed } from 'vue'
import { useGlobalStyles } from '@/composables/useGlobalStyles'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor, textColor } = useGlobalStyles()

const quote = computed(() => props.widget.content.quote || '')
const author = computed(() => props.widget.content.author || '')
const role = computed(() => props.widget.content.role || '')
const company = computed(() => props.widget.content.company || '')
const avatarUrl = computed(() => props.widget.content.avatarUrl || '')
const rating = computed(() => props.widget.content.rating || 0)

const hasContent = computed(() => quote.value || author.value)

const contentStyle = computed(() => ({
  padding: props.widget.styles.padding || '16px',
  backgroundColor: props.widget.styles.backgroundColor || '#f9fafb',
  borderRadius: props.widget.styles.borderRadius || '8px',
  textAlign: props.widget.styles.textAlign || 'left',
}))

const quoteStyle = computed(() => ({
  color: props.widget.styles.color || textColor.value,
  fontSize: props.widget.styles.fontSize || '16px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
}))

const authorStyle = computed(() => ({
  color: primaryColor.value,
  fontWeight: '600',
  fontSize: '14px',
}))

const roleStyle = computed(() => ({
  color: props.widget.styles.color || textColor.value,
  fontSize: '12px',
  opacity: 0.7,
}))

const stars = computed(() => {
  const fullStars = Math.floor(rating.value)
  const hasHalf = rating.value % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)
  return {
    full: fullStars,
    half: hasHalf,
    empty: emptyStars,
  }
})
</script>

<template>
  <div
    class="testimonial-widget"
    :style="{
      margin: widget.styles.margin,
    }"
  >
    <!-- Placeholder when empty -->
    <div v-if="!hasContent" class="testimonial-placeholder">
      <MessageSquareQuote :size="32" class="placeholder-icon" />
      <span class="placeholder-text">Ajouter un témoignage</span>
    </div>

    <!-- Testimonial content -->
    <div v-else class="testimonial-content" :style="contentStyle">
      <!-- Rating stars -->
      <div
        v-if="rating > 0"
        class="testimonial-rating"
        role="img"
        :aria-label="`Note : ${rating} sur 5 étoiles`"
      >
        <span v-for="i in stars.full" :key="`full-${i}`" class="star star-full" aria-hidden="true">★</span>
        <span v-if="stars.half" class="star star-half" aria-hidden="true">★</span>
        <span v-for="i in stars.empty" :key="`empty-${i}`" class="star star-empty" aria-hidden="true">★</span>
      </div>

      <!-- Quote -->
      <blockquote class="testimonial-quote" :style="quoteStyle">
        "{{ quote }}"
      </blockquote>

      <!-- Author section -->
      <div class="testimonial-author">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="author"
          class="testimonial-avatar"
        >
        <div class="testimonial-author-info">
          <span class="author-name" :style="authorStyle">{{ author }}</span>
          <span v-if="role || company" class="author-role" :style="roleStyle">
            {{ role }}{{ role && company ? ' — ' : '' }}{{ company }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.testimonial-placeholder {
  width: 100%;
  min-height: 140px;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.placeholder-icon {
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}

.testimonial-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.testimonial-rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 18px;
}

.star-full {
  color: var(--color-warning, #fbbf24);
}

.star-half {
  color: var(--color-warning, #fbbf24);
  opacity: 0.5;
}

.star-empty {
  color: var(--color-border, #d1d5db);
}

.testimonial-quote {
  margin: 0;
  padding: 0;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.testimonial-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.testimonial-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  line-height: 1.2;
}

.author-role {
  line-height: 1.2;
}
</style>
