import type {
  SectionCategoryInfo,
  SectionPreset,
  TemplateCategoryInfo,
  TemplatePreset,
} from '@/types/preset'

// =============================================================================
// Categories
// =============================================================================

export const templateCategories: TemplateCategoryInfo[] = [
  { id: 'marketing', label: 'Marketing', icon: 'Megaphone' },
  { id: 'event', label: 'Événement', icon: 'Calendar' },
  { id: 'product', label: 'Produit', icon: 'ShoppingBag' },
  { id: 'contact', label: 'Contact', icon: 'Phone' },
  { id: 'newsletter', label: 'Newsletter', icon: 'Mail' },
]

export const sectionCategories: SectionCategoryInfo[] = [
  { id: 'header', label: 'En-tête', icon: 'LayoutTop' },
  { id: 'hero', label: 'Hero', icon: 'Image' },
  { id: 'features', label: 'Fonctionnalités', icon: 'Sparkles' },
  { id: 'cta', label: 'Appel à l\'action', icon: 'MousePointerClick' },
  { id: 'testimonial', label: 'Témoignage', icon: 'MessageSquareQuote' },
  { id: 'contact', label: 'Contact', icon: 'Send' },
  { id: 'footer', label: 'Pied de page', icon: 'LayoutBottom' },
  { id: 'gallery', label: 'Galerie', icon: 'Images' },
]

// =============================================================================
// Template Presets (5)
// =============================================================================

export const templatePresets: TemplatePreset[] = [
  // ---------------------------------------------------------------------------
  // 1. Promo Flash
  // ---------------------------------------------------------------------------
  {
    id: 'promo-flash',
    name: 'Promo Flash',
    description: 'Template idéal pour les promotions limitées dans le temps avec un design percutant.',
    category: 'marketing',
    tags: ['promo', 'soldes', 'urgence', 'réduction'],
    thumbnail: 'https://picsum.photos/seed/promo-flash/280/400',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
    },
    widgets: [
      {
        id: 'promo-banner',
        type: 'image',
        order: 0,
        content: { src: 'https://picsum.photos/seed/promo-banner/600/300', alt: 'Bannière promotion' },
        styles: { width: '100%', padding: '0', borderRadius: '0' },
      },
      {
        id: 'promo-title',
        type: 'title',
        order: 1,
        content: { text: 'VENTE FLASH -50%' },
        styles: { fontSize: '28px', textAlign: 'center', color: '#dc2626', padding: '24px 16px 8px', fontWeight: '700' },
      },
      {
        id: 'promo-subtitle',
        type: 'text',
        order: 2,
        content: { text: 'Offre valable uniquement aujourd\'hui ! Ne manquez pas cette opportunité exceptionnelle.' },
        styles: { textAlign: 'center', padding: '0 16px 16px', color: '#64748b' },
      },
      {
        id: 'promo-cta',
        type: 'button',
        order: 3,
        content: { text: 'J\'en profite maintenant', action: 'link', href: '' },
        styles: { backgroundColor: '#dc2626', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontWeight: '600' },
      },
      {
        id: 'promo-separator',
        type: 'separator',
        order: 4,
        content: {},
        styles: { margin: '24px 0' },
      },
      {
        id: 'promo-products',
        type: 'row',
        order: 5,
        content: {},
        styles: { gap: '16px', padding: '0 16px' },
        children: [
          {
            id: 'promo-col1',
            type: 'column',
            order: 0,
            content: {},
            styles: { gap: '8px' },
            children: [
              {
                id: 'promo-img1',
                type: 'image',
                order: 0,
                content: { src: 'https://picsum.photos/seed/product1/300/300', alt: 'Produit 1' },
                styles: { borderRadius: '8px' },
              },
              {
                id: 'promo-price1',
                type: 'text',
                order: 1,
                content: { text: 'Produit vedette\n29,99 € au lieu de 59,99 €' },
                styles: { textAlign: 'center', fontSize: '14px' },
              },
            ],
          },
          {
            id: 'promo-col2',
            type: 'column',
            order: 1,
            content: {},
            styles: { gap: '8px' },
            children: [
              {
                id: 'promo-img2',
                type: 'image',
                order: 0,
                content: { src: 'https://picsum.photos/seed/product2/300/300', alt: 'Produit 2' },
                styles: { borderRadius: '8px' },
              },
              {
                id: 'promo-price2',
                type: 'text',
                order: 1,
                content: { text: 'Best-seller\n39,99 € au lieu de 79,99 €' },
                styles: { textAlign: 'center', fontSize: '14px' },
              },
            ],
          },
        ],
      },
      {
        id: 'promo-social',
        type: 'social',
        order: 6,
        content: { facebook: '', instagram: '', twitter: '' },
        styles: { padding: '24px 16px' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Invitation Événement
  // ---------------------------------------------------------------------------
  {
    id: 'event-invitation',
    name: 'Invitation Événement',
    description: 'Template pour invitations à des événements avec localisation et inscription.',
    category: 'event',
    tags: ['événement', 'invitation', 'conférence', 'salon'],
    thumbnail: 'https://picsum.photos/seed/event-invitation/280/400',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
    },
    widgets: [
      {
        id: 'event-banner',
        type: 'image',
        order: 0,
        content: { src: 'https://picsum.photos/seed/event-banner/600/250', alt: 'Bannière événement' },
        styles: { width: '100%', borderRadius: '0' },
      },
      {
        id: 'event-title',
        type: 'title',
        order: 1,
        content: { text: 'Grande Soirée d\'Inauguration' },
        styles: { fontSize: '26px', textAlign: 'center', padding: '24px 16px 8px', fontWeight: '700' },
      },
      {
        id: 'event-date',
        type: 'text',
        order: 2,
        content: { text: 'Samedi 15 Mars 2025 à 19h00' },
        styles: { textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#0d9488' },
      },
      {
        id: 'event-location',
        type: 'text',
        order: 3,
        content: { text: 'Espace des Congrès, 123 Avenue des Champs, 75008 Paris' },
        styles: { textAlign: 'center', padding: '8px 16px 16px', color: '#64748b' },
      },
      {
        id: 'event-description',
        type: 'text',
        order: 4,
        content: { text: 'Rejoignez-nous pour une soirée exceptionnelle ! Au programme : cocktail, animations et surprises. Entrée gratuite sur inscription.' },
        styles: { padding: '0 16px 16px', textAlign: 'center' },
      },
      {
        id: 'event-map',
        type: 'map',
        order: 5,
        content: { address: '123 Avenue des Champs-Élysées, 75008 Paris' },
        styles: { height: '200px', margin: '0 16px', borderRadius: '8px' },
      },
      {
        id: 'event-form-title',
        type: 'title',
        order: 6,
        content: { text: 'Inscrivez-vous' },
        styles: { fontSize: '20px', textAlign: 'center', padding: '24px 16px 16px' },
      },
      {
        id: 'event-form',
        type: 'form',
        order: 7,
        content: { submitText: 'Je m\'inscris', submitAction: 'submit' },
        styles: { padding: '0 16px' },
        children: [
          {
            id: 'event-field-name',
            type: 'form-field',
            order: 0,
            content: { fieldType: 'text', label: 'Nom complet', name: 'nom_complet', placeholder: 'Jean Dupont', required: true },
            styles: {},
          },
          {
            id: 'event-field-email',
            type: 'form-field',
            order: 1,
            content: { fieldType: 'email', label: 'Email', name: 'email', placeholder: 'jean@exemple.fr', required: true },
            styles: {},
          },
          {
            id: 'event-field-guests',
            type: 'form-field',
            order: 2,
            content: { fieldType: 'select', label: 'Nombre de personnes', name: 'nombre_personnes', options: '1\n2\n3\n4' },
            styles: {},
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Vitrine Produit
  // ---------------------------------------------------------------------------
  {
    id: 'product-showcase',
    name: 'Vitrine Produit',
    description: 'Présentation élégante d\'un produit avec galerie et spécifications.',
    category: 'product',
    tags: ['produit', 'e-commerce', 'vitrine', 'catalogue'],
    thumbnail: 'https://picsum.photos/seed/product-showcase/280/400',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
    },
    widgets: [
      {
        id: 'product-gallery',
        type: 'slider',
        order: 0,
        content: {
          images: [
            'https://picsum.photos/seed/prod-slide1/600/400',
            'https://picsum.photos/seed/prod-slide2/600/400',
            'https://picsum.photos/seed/prod-slide3/600/400',
          ],
        },
        styles: { height: '300px' },
      },
      {
        id: 'product-name',
        type: 'title',
        order: 1,
        content: { text: 'Montre Élégance Premium' },
        styles: { fontSize: '24px', padding: '24px 16px 8px', fontWeight: '700' },
      },
      {
        id: 'product-price',
        type: 'text',
        order: 2,
        content: { text: '299,00 €' },
        styles: { fontSize: '22px', fontWeight: '700', color: '#0d9488', padding: '0 16px' },
      },
      {
        id: 'product-description',
        type: 'text',
        order: 3,
        content: { text: 'Découvrez notre montre phare, alliance parfaite entre élégance et technologie. Boîtier en acier inoxydable, bracelet cuir véritable, mouvement automatique suisse.' },
        styles: { padding: '16px', color: '#64748b', lineHeight: '1.6' },
      },
      {
        id: 'product-features-title',
        type: 'title',
        order: 4,
        content: { text: 'Caractéristiques' },
        styles: { fontSize: '18px', padding: '8px 16px', fontWeight: '600' },
      },
      {
        id: 'product-features',
        type: 'text',
        order: 5,
        content: { text: '• Étanche 50m\n• Verre saphir anti-rayures\n• Garantie 2 ans\n• Livraison gratuite' },
        styles: { padding: '0 16px 16px', lineHeight: '1.8' },
      },
      {
        id: 'product-cta',
        type: 'button',
        order: 6,
        content: { text: 'Ajouter au panier', action: 'link', href: '' },
        styles: { backgroundColor: '#0d9488', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontWeight: '600' },
      },
      {
        id: 'product-phone',
        type: 'click-to-call',
        order: 7,
        content: { text: 'Des questions ? Appelez-nous', phone: '+33123456789' },
        styles: { padding: '16px', color: '#64748b' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Contact Simple
  // ---------------------------------------------------------------------------
  {
    id: 'contact-simple',
    name: 'Contact Simple',
    description: 'Page de contact minimaliste avec formulaire et coordonnées.',
    category: 'contact',
    tags: ['contact', 'formulaire', 'coordonnées'],
    thumbnail: 'https://picsum.photos/seed/contact-simple/280/400',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
    },
    widgets: [
      {
        id: 'contact-title',
        type: 'title',
        order: 0,
        content: { text: 'Contactez-nous' },
        styles: { fontSize: '28px', textAlign: 'center', padding: '32px 16px 8px', fontWeight: '700' },
      },
      {
        id: 'contact-intro',
        type: 'text',
        order: 1,
        content: { text: 'Une question, une suggestion ? N\'hésitez pas à nous écrire, nous vous répondrons dans les plus brefs délais.' },
        styles: { textAlign: 'center', padding: '0 16px 24px', color: '#64748b' },
      },
      {
        id: 'contact-form',
        type: 'form',
        order: 2,
        content: { submitText: 'Envoyer le message', submitAction: 'submit' },
        styles: { padding: '0 16px' },
        children: [
          {
            id: 'contact-field-name',
            type: 'form-field',
            order: 0,
            content: { fieldType: 'text', label: 'Votre nom', name: 'nom', placeholder: 'Jean Dupont', required: true },
            styles: {},
          },
          {
            id: 'contact-field-email',
            type: 'form-field',
            order: 1,
            content: { fieldType: 'email', label: 'Votre email', name: 'email', placeholder: 'jean@exemple.fr', required: true },
            styles: {},
          },
          {
            id: 'contact-field-message',
            type: 'form-field',
            order: 2,
            content: { fieldType: 'textarea', label: 'Votre message', name: 'message', placeholder: 'Écrivez votre message ici...', required: true },
            styles: {},
          },
        ],
      },
      {
        id: 'contact-separator',
        type: 'separator',
        order: 3,
        content: {},
        styles: { margin: '32px 16px' },
      },
      {
        id: 'contact-info-title',
        type: 'title',
        order: 4,
        content: { text: 'Nos coordonnées' },
        styles: { fontSize: '20px', textAlign: 'center', padding: '0 16px 16px' },
      },
      {
        id: 'contact-address',
        type: 'text',
        order: 5,
        content: { text: '123 Rue de la Paix, 75002 Paris\n01 23 45 67 89\ncontact@exemple.fr' },
        styles: { textAlign: 'center', lineHeight: '2', padding: '0 16px' },
      },
      {
        id: 'contact-map',
        type: 'map',
        order: 6,
        content: { address: '123 Rue de la Paix, 75002 Paris' },
        styles: { height: '200px', margin: '24px 16px', borderRadius: '8px' },
      },
      {
        id: 'contact-call',
        type: 'click-to-call',
        order: 7,
        content: { text: 'Appelez-nous directement', phone: '+33123456789' },
        styles: { padding: '16px' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Newsletter
  // ---------------------------------------------------------------------------
  {
    id: 'newsletter-signup',
    name: 'Newsletter',
    description: 'Page d\'inscription newsletter avec avantages et formulaire optimisé.',
    category: 'newsletter',
    tags: ['newsletter', 'email', 'inscription', 'abonnement'],
    thumbnail: 'https://picsum.photos/seed/newsletter/280/400',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
    },
    widgets: [
      {
        id: 'newsletter-icon',
        type: 'icon',
        order: 0,
        content: { iconName: 'Mail', iconSize: '48px', iconColor: '#0d9488' },
        styles: { textAlign: 'center', padding: '32px 16px 16px' },
      },
      {
        id: 'newsletter-title',
        type: 'title',
        order: 1,
        content: { text: 'Restez informé' },
        styles: { fontSize: '28px', textAlign: 'center', padding: '0 16px 8px', fontWeight: '700', color: '#f8fafc' },
      },
      {
        id: 'newsletter-subtitle',
        type: 'text',
        order: 2,
        content: { text: 'Inscrivez-vous à notre newsletter et recevez nos meilleures offres en avant-première.' },
        styles: { textAlign: 'center', padding: '0 16px 24px', color: '#94a3b8' },
      },
      {
        id: 'newsletter-benefits',
        type: 'text',
        order: 3,
        content: { text: '• Offres exclusives réservées aux abonnés\n• -10% sur votre première commande\n• Maximum 2 emails par mois\n• Désabonnement en 1 clic' },
        styles: { padding: '0 16px 24px', lineHeight: '2', color: '#e2e8f0' },
      },
      {
        id: 'newsletter-form',
        type: 'form',
        order: 4,
        content: { submitText: 'Je m\'abonne', submitAction: 'submit' },
        styles: { padding: '0 16px' },
        children: [
          {
            id: 'newsletter-field-email',
            type: 'form-field',
            order: 0,
            content: { fieldType: 'email', label: 'Votre adresse email', name: 'email', placeholder: 'exemple@email.fr', required: true },
            styles: {},
          },
        ],
      },
      {
        id: 'newsletter-privacy',
        type: 'text',
        order: 5,
        content: { text: 'En vous inscrivant, vous acceptez de recevoir nos communications. Vos données sont protégées et ne seront jamais partagées.' },
        styles: { fontSize: '12px', textAlign: 'center', padding: '24px 16px', color: '#64748b' },
      },
    ],
  },
]

// =============================================================================
// Section Presets (8)
// =============================================================================

export const sectionPresets: SectionPreset[] = [
  // ---------------------------------------------------------------------------
  // 1. Hero avec Image
  // ---------------------------------------------------------------------------
  {
    id: 'hero-image',
    name: 'Hero avec Image',
    description: 'Section hero impactante avec image, titre et bouton d\'action.',
    category: 'hero',
    tags: ['hero', 'bannière', 'header'],
    thumbnail: 'https://picsum.photos/seed/section-hero/120/80',
    widgets: [
      {
        id: 'hero-img',
        type: 'image',
        order: 0,
        content: { src: 'https://picsum.photos/seed/hero-bg/600/300', alt: 'Image hero' },
        styles: { width: '100%', borderRadius: '0' },
      },
      {
        id: 'hero-title',
        type: 'title',
        order: 1,
        content: { text: 'Titre Principal Accrocheur' },
        styles: { fontSize: '28px', textAlign: 'center', padding: '24px 16px 8px', fontWeight: '700' },
      },
      {
        id: 'hero-text',
        type: 'text',
        order: 2,
        content: { text: 'Sous-titre qui présente votre offre de manière claire et concise.' },
        styles: { textAlign: 'center', padding: '0 16px 16px', color: '#64748b' },
      },
      {
        id: 'hero-button',
        type: 'button',
        order: 3,
        content: { text: 'Découvrir', action: 'link', href: '' },
        styles: { backgroundColor: '#0d9488', color: '#ffffff', padding: '12px 24px', borderRadius: '8px' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. 3 Avantages en colonnes
  // ---------------------------------------------------------------------------
  {
    id: 'features-3col',
    name: '3 Avantages',
    description: 'Mise en avant de 3 avantages ou fonctionnalités clés en colonnes.',
    category: 'features',
    tags: ['features', 'avantages', 'colonnes'],
    thumbnail: 'https://picsum.photos/seed/section-features/120/80',
    widgets: [
      {
        id: 'features-title',
        type: 'title',
        order: 0,
        content: { text: 'Nos Avantages' },
        styles: { fontSize: '24px', textAlign: 'center', padding: '24px 16px 16px', fontWeight: '700' },
      },
      {
        id: 'features-row',
        type: 'row',
        order: 1,
        content: {},
        styles: { gap: '16px', padding: '0 16px 24px' },
        children: [
          {
            id: 'feature-col1',
            type: 'column',
            order: 0,
            content: {},
            styles: { gap: '8px', textAlign: 'center' },
            children: [
              { id: 'feature-icon1', type: 'icon', order: 0, content: { iconName: 'Zap', iconSize: '32px', iconColor: '#0d9488' }, styles: { textAlign: 'center' } },
              { id: 'feature-title1', type: 'title', order: 1, content: { text: 'Rapide' }, styles: { fontSize: '16px', fontWeight: '600' } },
              { id: 'feature-text1', type: 'text', order: 2, content: { text: 'Description de l\'avantage numéro un.' }, styles: { fontSize: '14px', color: '#64748b' } },
            ],
          },
          {
            id: 'feature-col2',
            type: 'column',
            order: 1,
            content: {},
            styles: { gap: '8px', textAlign: 'center' },
            children: [
              { id: 'feature-icon2', type: 'icon', order: 0, content: { iconName: 'Shield', iconSize: '32px', iconColor: '#0d9488' }, styles: { textAlign: 'center' } },
              { id: 'feature-title2', type: 'title', order: 1, content: { text: 'Sécurisé' }, styles: { fontSize: '16px', fontWeight: '600' } },
              { id: 'feature-text2', type: 'text', order: 2, content: { text: 'Description de l\'avantage numéro deux.' }, styles: { fontSize: '14px', color: '#64748b' } },
            ],
          },
          {
            id: 'feature-col3',
            type: 'column',
            order: 2,
            content: {},
            styles: { gap: '8px', textAlign: 'center' },
            children: [
              { id: 'feature-icon3', type: 'icon', order: 0, content: { iconName: 'Heart', iconSize: '32px', iconColor: '#0d9488' }, styles: { textAlign: 'center' } },
              { id: 'feature-title3', type: 'title', order: 1, content: { text: 'Fiable' }, styles: { fontSize: '16px', fontWeight: '600' } },
              { id: 'feature-text3', type: 'text', order: 2, content: { text: 'Description de l\'avantage numéro trois.' }, styles: { fontSize: '14px', color: '#64748b' } },
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Bannière CTA
  // ---------------------------------------------------------------------------
  {
    id: 'cta-banner',
    name: 'Bannière CTA',
    description: 'Bannière d\'appel à l\'action avec fond coloré.',
    category: 'cta',
    tags: ['cta', 'action', 'bannière'],
    thumbnail: 'https://picsum.photos/seed/section-cta/120/80',
    widgets: [
      {
        id: 'cta-title',
        type: 'title',
        order: 0,
        content: { text: 'Prêt à commencer ?' },
        styles: { fontSize: '24px', textAlign: 'center', color: '#ffffff', padding: '32px 16px 8px', fontWeight: '700' },
      },
      {
        id: 'cta-text',
        type: 'text',
        order: 1,
        content: { text: 'Rejoignez des milliers de clients satisfaits dès aujourd\'hui.' },
        styles: { textAlign: 'center', color: '#e0f2fe', padding: '0 16px 16px' },
      },
      {
        id: 'cta-button',
        type: 'button',
        order: 2,
        content: { text: 'Commencer maintenant', action: 'link', href: '' },
        styles: { backgroundColor: '#ffffff', color: '#0d9488', padding: '12px 24px', borderRadius: '8px', fontWeight: '600' },
      },
      {
        id: 'cta-spacer',
        type: 'spacer',
        order: 3,
        content: {},
        styles: { height: '24px' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Formulaire Contact
  // ---------------------------------------------------------------------------
  {
    id: 'contact-form',
    name: 'Formulaire Contact',
    description: 'Formulaire de contact complet avec champs essentiels.',
    category: 'contact',
    tags: ['contact', 'formulaire', 'email'],
    thumbnail: 'https://picsum.photos/seed/section-contact/120/80',
    widgets: [
      {
        id: 'contact-section-title',
        type: 'title',
        order: 0,
        content: { text: 'Contactez-nous' },
        styles: { fontSize: '24px', textAlign: 'center', padding: '24px 16px 16px', fontWeight: '700' },
      },
      {
        id: 'contact-section-form',
        type: 'form',
        order: 1,
        content: { submitText: 'Envoyer', submitAction: 'submit' },
        styles: { padding: '0 16px 24px' },
        children: [
          { id: 'contact-f-name', type: 'form-field', order: 0, content: { fieldType: 'text', label: 'Nom', name: 'nom', required: true }, styles: {} },
          { id: 'contact-f-email', type: 'form-field', order: 1, content: { fieldType: 'email', label: 'Email', name: 'email', required: true }, styles: {} },
          { id: 'contact-f-tel', type: 'form-field', order: 2, content: { fieldType: 'tel', label: 'Téléphone', name: 'telephone' }, styles: {} },
          { id: 'contact-f-msg', type: 'form-field', order: 3, content: { fieldType: 'textarea', label: 'Message', name: 'message', required: true }, styles: {} },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Témoignage Client
  // ---------------------------------------------------------------------------
  {
    id: 'testimonial-single',
    name: 'Témoignage Client',
    description: 'Citation d\'un client avec photo et nom.',
    category: 'testimonial',
    tags: ['témoignage', 'avis', 'client'],
    thumbnail: 'https://picsum.photos/seed/section-testimonial/120/80',
    widgets: [
      {
        id: 'testimonial-avatar',
        type: 'image',
        order: 0,
        content: { src: 'https://picsum.photos/seed/avatar/100/100', alt: 'Photo client' },
        styles: { width: '80px', height: '80px', borderRadius: '50%', margin: '24px auto 16px' },
      },
      {
        id: 'testimonial-quote',
        type: 'text',
        order: 1,
        content: { text: '« Service exceptionnel ! Je recommande vivement. L\'équipe est à l\'écoute et les résultats dépassent mes attentes. »' },
        styles: { textAlign: 'center', fontStyle: 'italic', padding: '0 24px 16px', fontSize: '16px', lineHeight: '1.6' },
      },
      {
        id: 'testimonial-name',
        type: 'text',
        order: 2,
        content: { text: 'Marie Dupont\nDirectrice Marketing, Entreprise ABC' },
        styles: { textAlign: 'center', fontWeight: '600', padding: '0 16px 24px', color: '#64748b' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. Galerie 4 Images
  // ---------------------------------------------------------------------------
  {
    id: 'gallery-4',
    name: 'Galerie 4 Images',
    description: 'Grille de 4 images en disposition 2x2.',
    category: 'gallery',
    tags: ['galerie', 'images', 'photos'],
    thumbnail: 'https://picsum.photos/seed/section-gallery/120/80',
    widgets: [
      {
        id: 'gallery-title',
        type: 'title',
        order: 0,
        content: { text: 'Notre Galerie' },
        styles: { fontSize: '24px', textAlign: 'center', padding: '24px 16px 16px', fontWeight: '700' },
      },
      {
        id: 'gallery-row1',
        type: 'row',
        order: 1,
        content: {},
        styles: { gap: '8px', padding: '0 16px 8px' },
        children: [
          { id: 'gallery-col1', type: 'column', order: 0, content: {}, styles: {}, children: [
            { id: 'gallery-img1', type: 'image', order: 0, content: { src: 'https://picsum.photos/seed/gal1/300/200', alt: 'Image 1' }, styles: { borderRadius: '8px' } },
          ] },
          { id: 'gallery-col2', type: 'column', order: 1, content: {}, styles: {}, children: [
            { id: 'gallery-img2', type: 'image', order: 0, content: { src: 'https://picsum.photos/seed/gal2/300/200', alt: 'Image 2' }, styles: { borderRadius: '8px' } },
          ] },
        ],
      },
      {
        id: 'gallery-row2',
        type: 'row',
        order: 2,
        content: {},
        styles: { gap: '8px', padding: '0 16px 24px' },
        children: [
          { id: 'gallery-col3', type: 'column', order: 0, content: {}, styles: {}, children: [
            { id: 'gallery-img3', type: 'image', order: 0, content: { src: 'https://picsum.photos/seed/gal3/300/200', alt: 'Image 3' }, styles: { borderRadius: '8px' } },
          ] },
          { id: 'gallery-col4', type: 'column', order: 1, content: {}, styles: {}, children: [
            { id: 'gallery-img4', type: 'image', order: 0, content: { src: 'https://picsum.photos/seed/gal4/300/200', alt: 'Image 4' }, styles: { borderRadius: '8px' } },
          ] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. En-tête Simple
  // ---------------------------------------------------------------------------
  {
    id: 'header-simple',
    name: 'En-tête Simple',
    description: 'En-tête minimaliste avec logo et titre.',
    category: 'header',
    tags: ['header', 'logo', 'titre'],
    thumbnail: 'https://picsum.photos/seed/section-header/120/80',
    widgets: [
      {
        id: 'header-logo',
        type: 'image',
        order: 0,
        content: { src: 'https://picsum.photos/seed/logo/120/40', alt: 'Logo' },
        styles: { width: '120px', margin: '16px auto 8px' },
      },
      {
        id: 'header-title',
        type: 'title',
        order: 1,
        content: { text: 'Nom de l\'Entreprise' },
        styles: { fontSize: '20px', textAlign: 'center', padding: '0 16px 16px', fontWeight: '600' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. Pied de Page Social
  // ---------------------------------------------------------------------------
  {
    id: 'footer-social',
    name: 'Pied de Page Social',
    description: 'Pied de page avec liens réseaux sociaux et copyright.',
    category: 'footer',
    tags: ['footer', 'social', 'réseaux'],
    thumbnail: 'https://picsum.photos/seed/section-footer/120/80',
    widgets: [
      {
        id: 'footer-separator',
        type: 'separator',
        order: 0,
        content: {},
        styles: { margin: '24px 16px' },
      },
      {
        id: 'footer-social',
        type: 'social',
        order: 1,
        content: { facebook: '', instagram: '', twitter: '', linkedin: '' },
        styles: { padding: '0 16px 16px' },
      },
      {
        id: 'footer-copyright',
        type: 'text',
        order: 2,
        content: { text: '© 2025 Nom de l\'Entreprise. Tous droits réservés.' },
        styles: { textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '0 16px 24px' },
      },
    ],
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

export function getTemplatesByCategory(category: string): TemplatePreset[] {
  return templatePresets.filter(t => t.category === category)
}

export function getSectionsByCategory(category: string): SectionPreset[] {
  return sectionPresets.filter(s => s.category === category)
}

export function searchTemplates(query: string): TemplatePreset[] {
  const q = query.toLowerCase()
  return templatePresets.filter(t =>
    t.name.toLowerCase().includes(q)
    || t.description.toLowerCase().includes(q)
    || t.tags.some(tag => tag.toLowerCase().includes(q)),
  )
}

export function searchSections(query: string): SectionPreset[] {
  const q = query.toLowerCase()
  return sectionPresets.filter(s =>
    s.name.toLowerCase().includes(q)
    || s.description.toLowerCase().includes(q)
    || s.tags.some(tag => tag.toLowerCase().includes(q)),
  )
}

export function getTemplateById(id: string): TemplatePreset | undefined {
  return templatePresets.find(t => t.id === id)
}

export function getSectionById(id: string): SectionPreset | undefined {
  return sectionPresets.find(s => s.id === id)
}
