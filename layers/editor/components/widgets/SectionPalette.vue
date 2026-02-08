<script setup lang="ts">
import { Image, LayoutGrid, MessageSquare, MousePointer, Sparkles, Target, Trophy, Users } from 'lucide-vue-next'

const widgetsStore = useWidgetsStore()

interface SectionTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: 'conversion' | 'engagement' | 'content'
  widgets: Partial<Widget>[]
}

const sectionTemplates: SectionTemplate[] = [
  // CONVERSION
  {
    id: 'hero-cta',
    name: 'Hero + CTA',
    description: 'Titre accrocheur avec bouton d\'action',
    icon: Target,
    category: 'conversion',
    widgets: [
      { type: 'title', content: { text: 'Votre titre accrocheur ici' }, styles: { fontSize: '28px', fontWeight: '700', textAlign: 'center' } },
      { type: 'text', content: { text: 'Une description courte et percutante qui incite à l\'action.' }, styles: { textAlign: 'center', padding: '8px 16px' } },
      { type: 'button', content: { text: 'Découvrir', action: 'link', href: '#' }, styles: { backgroundColor: '#3b82f6', color: '#ffffff', textAlign: 'center' } },
    ],
  },
  {
    id: 'lead-form',
    name: 'Formulaire Lead',
    description: 'Collecte d\'emails avec titre',
    icon: Users,
    category: 'conversion',
    widgets: [
      { type: 'title', content: { text: 'Inscrivez-vous' }, styles: { fontSize: '24px', textAlign: 'center' } },
      { type: 'form', content: { successMessage: 'Merci pour votre inscription !' }, children: [] },
    ],
  },
  {
    id: 'promo-banner',
    name: 'Bannière Promo',
    description: 'Image cliquable avec CTA',
    icon: Image,
    category: 'conversion',
    widgets: [
      { type: 'image', content: { src: 'https://placehold.co/600x300/3b82f6/ffffff?text=Promo', alt: 'Promotion' }, styles: { padding: '0' } },
      { type: 'button', content: { text: 'Profiter de l\'offre', action: 'link', href: '#' }, styles: { backgroundColor: '#ef4444', color: '#ffffff' } },
    ],
  },

  // ENGAGEMENT
  {
    id: 'scratch-game',
    name: 'Jeu à gratter',
    description: 'Carte à gratter avec CTA',
    icon: Sparkles,
    category: 'engagement',
    widgets: [
      { type: 'title', content: { text: 'Tentez votre chance !' }, styles: { textAlign: 'center' } },
      { type: 'scratch', content: { scratchImageFg: '', scratchImageBg: '', scratchPercent: 50 }, styles: {} },
      { type: 'button', content: { text: 'Découvrir mon gain', action: 'link', href: '#' }, styles: { backgroundColor: '#10b981' } },
    ],
  },
  {
    id: 'flipcard-reveal',
    name: 'Carte mystère',
    description: 'Flipcard avec révélation',
    icon: Trophy,
    category: 'engagement',
    widgets: [
      { type: 'text', content: { text: 'Cliquez pour découvrir votre surprise' }, styles: { textAlign: 'center' } },
      { type: 'flipcard', content: { flipcardImageFront: '', flipcardImageBack: '' }, styles: {} },
    ],
  },
  {
    id: 'store-finder',
    name: 'Trouver un magasin',
    description: 'Store locator avec drive',
    icon: Target,
    category: 'engagement',
    widgets: [
      { type: 'title', content: { text: 'Trouvez le magasin le plus proche' }, styles: { textAlign: 'center' } },
      { type: 'store-locator', content: { storeLocatorButtonText: 'Voir les magasins' }, styles: {} },
    ],
  },

  // CONTENT
  {
    id: 'text-image',
    name: 'Texte + Image',
    description: 'Contenu classique illustré',
    icon: LayoutGrid,
    category: 'content',
    widgets: [
      { type: 'title', content: { text: 'Titre de section' }, styles: {} },
      { type: 'image', content: { src: 'https://placehold.co/400x200', alt: 'Illustration' }, styles: {} },
      { type: 'text', content: { text: 'Votre contenu explicatif ici. Décrivez votre produit, service ou message.' }, styles: {} },
    ],
  },
  {
    id: 'video-section',
    name: 'Section Vidéo',
    description: 'Vidéo avec contexte',
    icon: MousePointer,
    category: 'content',
    widgets: [
      { type: 'title', content: { text: 'Découvrez en vidéo' }, styles: { textAlign: 'center' } },
      { type: 'video', content: { videoUrl: '', videoAutoplay: false }, styles: {} },
      { type: 'text', content: { text: 'Description de la vidéo et call-to-action.' }, styles: { textAlign: 'center' } },
    ],
  },
  {
    id: 'testimonial',
    name: 'Témoignage',
    description: 'Citation client avec avatar',
    icon: MessageSquare,
    category: 'content',
    widgets: [
      { type: 'separator', content: {}, styles: {} },
      { type: 'text', content: { text: '"Ce produit a changé ma vie ! Je le recommande à tous."' }, styles: { fontStyle: 'italic', textAlign: 'center', fontSize: '18px' } },
      { type: 'text', content: { text: '— Marie D., cliente satisfaite' }, styles: { textAlign: 'center', color: '#6b7280' } },
      { type: 'separator', content: {}, styles: {} },
    ],
  },
]

const categories = [
  { id: 'conversion', label: 'Conversion', icon: Target },
  { id: 'engagement', label: 'Engagement', icon: Sparkles },
  { id: 'content', label: 'Contenu', icon: LayoutGrid },
]

function getTemplatesByCategory(categoryId: string) {
  return sectionTemplates.filter(t => t.category === categoryId)
}

function addSection(template: SectionTemplate) {
  // Ajouter chaque widget du template
  template.widgets.forEach((widgetData) => {
    if (widgetData.type) {
      widgetsStore.addWidget(widgetData.type, widgetData.content, widgetData.styles)
    }
  })
}
</script>

<template>
  <div class="section-palette">
    <p class="palette-intro">
      Sections pré-conçues pour démarrer rapidement
    </p>

    <div v-for="category in categories" :key="category.id" class="section-category">
      <h3 class="category-title">
        <component :is="category.icon" :size="14" />
        {{ category.label }}
      </h3>

      <div class="section-grid">
        <button
          v-for="template in getTemplatesByCategory(category.id)"
          :key="template.id"
          class="section-card"
          :title="template.description"
          @click="addSection(template)"
        >
          <div class="section-icon">
            <component :is="template.icon" :size="20" />
          </div>
          <div class="section-info">
            <span class="section-name">{{ template.name }}</span>
            <span class="section-desc">{{ template.description }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-palette {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.palette-intro {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.section-category {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.category-title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0;
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.section-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.section-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.section-card:hover {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
  transform: translateX(4px);
}

.section-card:active {
  transform: scale(0.98);
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.section-card:hover .section-icon {
  background: var(--color-primary-100);
  color: var(--color-primary-600);
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.section-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.section-desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
