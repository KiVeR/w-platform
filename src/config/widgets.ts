import type { WidgetCategory, WidgetConfig, WidgetType } from '@/types/widget'

export const widgetConfigs: WidgetConfig[] = [
  // ==================== BASE ====================
  {
    type: 'title',
    label: 'Titre',
    icon: 'T',
    category: 'base',
    description: 'Heading text for sections. Use for main titles, section headers, or important announcements. Supports various font sizes and alignments.',
    usageHints: [
      'Use for page headers and section titles',
      'Keep titles concise and impactful',
      'Consider text hierarchy: larger for main title, smaller for subsections',
    ],
    requiredContent: ['text'],
    examples: [
      {
        description: 'Main page title',
        widget: {
          type: 'title',
          content: { text: 'Bienvenue sur notre site' },
          styles: { fontSize: '32px', textAlign: 'center' },
        },
      },
    ],
    defaultContent: { text: 'Mon titre' },
    defaultStyles: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      textAlign: 'center',
      padding: '16px',
      margin: '0',
    },
  },
  {
    type: 'text',
    label: 'Texte',
    icon: '¶',
    category: 'base',
    description: 'Paragraph text for descriptions, explanations, and body content. Supports rich formatting through styles.',
    usageHints: [
      'Use for descriptive content and explanations',
      'Keep paragraphs readable (3-5 sentences)',
      'Place after titles to provide context',
    ],
    requiredContent: ['text'],
    defaultContent: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    defaultStyles: {
      fontSize: '16px',
      color: '#475569',
      textAlign: 'left',
      padding: '12px 16px',
      margin: '0',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼',
    category: 'base',
    description: 'Display an image. Use for product photos, illustrations, banners, or decorative visuals. Always provide alt text for accessibility.',
    usageHints: [
      'Always provide descriptive alt text for accessibility',
      'Use appropriate image dimensions for the context',
      'Optimize images for web to ensure fast loading',
    ],
    requiredContent: ['src'],
    examples: [
      {
        description: 'Product image',
        widget: {
          type: 'image',
          content: { src: 'https://example.com/product.jpg', alt: 'Product name' },
          styles: { width: '100%', borderRadius: '8px' },
        },
      },
    ],
    defaultContent: {
      src: 'https://picsum.photos/seed/default/300/200',
      alt: 'Image',
    },
    defaultStyles: {
      width: '100%',
      borderRadius: '8px',
      padding: '8px',
      margin: '0',
    },
  },
  {
    type: 'button',
    label: 'Bouton',
    icon: '▢',
    category: 'action',
    description: 'Interactive button with customizable action. Supports navigation links (href), phone calls (tel:), and email (mailto:). Use for CTAs, form submission, and user actions.',
    usageHints: [
      'Always provide descriptive button text (not just "Click here")',
      'Use action="link" for navigation, action="tel" for phone calls',
      'Ensure href/phone property matches the action type',
      'Place buttons after explanatory content, not before',
    ],
    requiredContent: ['text', 'action'],
    examples: [
      {
        description: 'CTA button with external link',
        widget: {
          type: 'button',
          content: { text: 'Découvrir nos offres', action: 'link', href: 'https://example.com/offers' },
          styles: { backgroundColor: '#3b82f6', color: '#ffffff' },
        },
      },
      {
        description: 'Phone call button',
        widget: {
          type: 'button',
          content: { text: 'Appelez-nous', action: 'tel', phone: '+33123456789' },
          styles: { backgroundColor: '#22c55e', color: '#ffffff' },
        },
      },
    ],
    defaultContent: {
      text: 'Cliquez ici',
      action: 'link',
      href: '',
    },
    defaultStyles: {
      backgroundColor: '#14b8a6',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
      padding: '12px 24px',
      margin: '8px 16px',
      borderRadius: '8px',
    },
  },
  {
    type: 'separator',
    label: 'Séparateur',
    icon: '─',
    category: 'base',
    defaultContent: {},
    defaultStyles: {
      borderStyle: 'solid',
      borderColor: '#e2e8f0',
      borderWidth: '1px',
      margin: '16px',
      padding: '0',
    },
  },
  {
    type: 'spacer',
    label: 'Espace',
    icon: '↕',
    category: 'base',
    defaultContent: {},
    defaultStyles: {
      height: '32px',
      margin: '0',
      padding: '0',
    },
  },
  {
    type: 'click-to-call',
    label: 'Click to Call',
    icon: '📞',
    category: 'action',
    defaultContent: {
      text: 'Appeler',
      phone: '+33123456789',
      action: 'tel',
    },
    defaultStyles: {
      backgroundColor: '#14b8a6',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
      padding: '12px 24px',
      margin: '8px 16px',
      borderRadius: '8px',
    },
  },

  // ==================== STRUCTURE ====================
  {
    type: 'row',
    label: 'Colonnes',
    icon: '▥',
    category: 'structure',
    description: 'Horizontal layout container. Creates a row that can only contain column widgets. Use for multi-column layouts, side-by-side content, or grid structures.',
    usageHints: [
      'Row can ONLY contain column widgets as direct children',
      'Use 2-4 columns for most layouts',
      'On mobile, columns will stack vertically (responsive)',
      'Add widgets inside columns, not directly in rows',
    ],
    canHaveChildren: true,
    allowedChildren: ['column'],
    examples: [
      {
        description: 'Two-column layout',
        widget: {
          type: 'row',
          content: { gap: '16px' },
          children: [
            { type: 'column', content: { columnWidth: '50%' } },
            { type: 'column', content: { columnWidth: '50%' } },
          ],
        },
      },
    ],
    defaultContent: {
      gap: '16px',
      align: 'stretch',
      wrap: true,
    },
    defaultStyles: {
      display: 'flex',
      flexDirection: 'row',
      gap: '16px',
      flexWrap: 'wrap',
      padding: '8px',
      margin: '0',
    },
  },
  {
    type: 'column',
    label: 'Colonne',
    icon: '▯',
    category: 'structure',
    description: 'Vertical container inside a row. Holds any widget type except row/column. Set columnWidth to control proportions (e.g., "50%", "33%").',
    usageHints: [
      'Columns must be placed inside a row widget',
      'Cannot contain row or column (prevents infinite nesting)',
      'Use columnWidth to set relative width (e.g., "33%", "50%", "66%")',
      'Place any other widget type inside columns',
    ],
    canHaveChildren: true,
    disallowedChildren: ['row', 'column'],
    defaultContent: {
      columnWidth: '50%',
    },
    defaultStyles: {
      flex: '1',
      minWidth: '0',
      padding: '8px',
    },
  },

  // ==================== FORMULAIRES ====================
  {
    type: 'form',
    label: 'Formulaire',
    icon: '📋',
    category: 'form',
    description: 'Form container for collecting user input. Contains form-field widgets and a submit button. Supports email notifications and redirect after submission.',
    usageHints: [
      'Place form-field widgets inside the form container',
      'Cannot contain nested forms',
      'Set successMessage for user feedback after submission',
      'Use emailNotify to receive submissions by email',
    ],
    canHaveChildren: true,
    disallowedChildren: ['form'],
    examples: [
      {
        description: 'Contact form',
        widget: {
          type: 'form',
          content: {
            successMessage: 'Merci pour votre message !',
            emailNotify: true,
            emailTo: 'contact@example.com',
          },
        },
      },
    ],
    defaultContent: {
      redirectUrl: '',
      successMessage: 'Merci ! Votre message a bien été envoyé.',
      emailNotify: false,
      emailSubject: 'Nouveau message',
      emailTo: '',
    },
    defaultStyles: {
      padding: '16px',
      margin: '0',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
    },
  },
  {
    type: 'form-field',
    label: 'Champ',
    icon: '⎕',
    category: 'form',
    description: 'Input field for forms. Supports text, email, phone, textarea, select, checkbox, radio, date, and number types. Must be placed inside a form widget.',
    usageHints: [
      'Always set a descriptive label for accessibility',
      'Use appropriate fieldType (email, tel, textarea, etc.)',
      'Mark important fields as required',
      'Provide placeholder text to guide users',
      'Field name is auto-generated from label if not provided',
    ],
    requiredContent: ['fieldType', 'label'],
    examples: [
      {
        description: 'Email input field',
        widget: {
          type: 'form-field',
          content: {
            fieldType: 'email',
            label: 'Votre email',
            placeholder: 'exemple@email.com',
            required: true,
          },
        },
      },
    ],
    defaultContent: {
      fieldType: 'text',
      label: 'Votre nom',
      placeholder: '',
      required: false,
      name: '',
    },
    defaultStyles: {
      margin: '0 0 16px 0',
      padding: '0',
    },
  },

  // ==================== MÉDIA ====================
  {
    type: 'video',
    label: 'Vidéo',
    icon: '🎬',
    category: 'media',
    description: 'Embedded video player. Supports YouTube, Vimeo, and custom video URLs. Configure autoplay, mute, loop, and controls options.',
    usageHints: [
      'Paste a YouTube or Vimeo URL in videoUrl',
      'Use muted: true if enabling autoplay (browser requirement)',
      'Keep controls: true for user accessibility',
    ],
    requiredContent: ['videoUrl'],
    examples: [
      {
        description: 'YouTube video embed',
        widget: {
          type: 'video',
          content: {
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            videoProvider: 'youtube',
            controls: true,
          },
        },
      },
    ],
    defaultContent: {
      videoUrl: '',
      videoProvider: 'youtube',
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
    },
    defaultStyles: {
      margin: '0',
      padding: '8px',
      borderRadius: '8px',
    },
  },
  {
    type: 'map',
    label: 'Carte',
    icon: '📍',
    category: 'media',
    description: 'Interactive map display. Enter an address to show a location. Supports different map styles and zoom levels.',
    usageHints: [
      'Enter a full address for best accuracy',
      'Adjust zoom level based on context (15 for street level, 12 for neighborhood)',
      'Choose mapStyle based on content (roadmap for directions, satellite for aerial view)',
    ],
    requiredContent: ['address'],
    examples: [
      {
        description: 'Store location map',
        widget: {
          type: 'map',
          content: {
            address: '1 Place du Trocadéro, 75116 Paris',
            zoom: 15,
            mapStyle: 'roadmap',
          },
        },
      },
    ],
    defaultContent: {
      address: '',
      zoom: 15,
      mapStyle: 'roadmap',
    },
    defaultStyles: {
      margin: '0',
      padding: '8px',
      borderRadius: '8px',
    },
  },
  {
    type: 'social',
    label: 'Réseaux',
    icon: '🔗',
    category: 'media',
    defaultContent: {
      socialLinks: [
        { platform: 'facebook', url: '', enabled: true },
        { platform: 'instagram', url: '', enabled: true },
        { platform: 'twitter', url: '', enabled: false },
        { platform: 'linkedin', url: '', enabled: false },
        { platform: 'youtube', url: '', enabled: false },
        { platform: 'whatsapp', url: '', enabled: false },
      ],
      socialStyle: 'icons',
      socialSize: 'medium',
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '8px',
      textAlign: 'center',
    },
  },
  {
    type: 'icon',
    label: 'Icône',
    icon: '⭐',
    category: 'media',
    defaultContent: {
      iconName: '⭐',
      iconSize: '48px',
      iconColor: '',
      href: '',
    },
    defaultStyles: {
      margin: '8px 0',
      padding: '8px',
      textAlign: 'center',
    },
  },

  // ==================== WELLPACK ====================
  {
    type: 'barcode',
    label: 'Code barre',
    icon: '📊',
    category: 'wellpack',
    defaultContent: {
      barcodeCode: '0000000000000',
      barcodeType: 'ean13',
      barcodeColor: '#000000',
      barcodeVariable: '',
    },
    defaultStyles: {
      margin: '16px auto',
      padding: '8px',
      textAlign: 'center',
    },
  },
  {
    type: 'store-locator',
    label: 'Store Locator',
    icon: '📍',
    category: 'wellpack',
    defaultContent: {
      storeLocatorLabel: 'Nos magasins',
      storeLocatorButtonText: 'Voir tous les lieux',
      storeLocatorButtonColor: '#14b8a6',
      storeLocatorStores: [],
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '16px',
      textAlign: 'center',
    },
  },
  {
    type: 'drive',
    label: 'Drive to Store',
    icon: '🚗',
    category: 'wellpack',
    defaultContent: {
      driveButtonText: 'Trouver le magasin le plus proche',
      driveButtonColor: '#14b8a6',
      driveStores: [],
      driveBtnGoLabel: 'S\'y rendre',
      driveBtnCallLabel: 'Appeler',
      driveBtnGoColor: '#14b8a6',
      driveBtnCallColor: '#6366f1',
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '16px',
      textAlign: 'center',
    },
  },
  {
    type: 'scratch',
    label: 'Carte à gratter',
    icon: '🎰',
    category: 'wellpack',
    defaultContent: {
      scratchImageFg: 'https://via.placeholder.com/300x200/cccccc/666666?text=Grattez+ici',
      scratchImageBg: 'https://via.placeholder.com/300x200/22c55e/ffffff?text=Gagn%C3%A9+!',
      scratchSize: 30,
      scratchPercent: 80,
      scratchLink: '',
    },
    defaultStyles: {
      margin: '16px auto',
      padding: '0',
      textAlign: 'center',
    },
  },
  {
    type: 'flipcard',
    label: 'Carte retournable',
    icon: '🔄',
    category: 'wellpack',
    defaultContent: {
      flipcardImageFront: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Recto',
      flipcardImageBack: 'https://via.placeholder.com/300x200/22c55e/ffffff?text=Verso',
      flipcardLink: '',
    },
    defaultStyles: {
      margin: '16px auto',
      padding: '0',
      textAlign: 'center',
    },
  },

  // ==================== AVANCÉ ====================
  {
    type: 'gallery',
    label: 'Galerie',
    icon: '🖼️',
    category: 'media',
    defaultContent: {
      galleryImages: [],
      galleryButtonText: 'Voir la galerie',
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '8px',
      textAlign: 'center',
    },
  },
  {
    type: 'slider',
    label: 'Carrousel',
    icon: '🎠',
    category: 'media',
    defaultContent: {
      sliderImages: [],
      sliderInterval: 3000,
      sliderChevronColor: '#ffffff',
      sliderAutoplay: true,
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '0',
      textAlign: 'center',
    },
  },
  {
    type: 'link-image',
    label: 'Image lien',
    icon: '🔗',
    category: 'base',
    defaultContent: {
      linkImageSrc: 'https://via.placeholder.com/300x200',
      linkImageAlt: 'Image',
      linkImageHref: '',
    },
    defaultStyles: {
      margin: '8px 0',
      padding: '0',
      textAlign: 'center',
    },
  },
  {
    type: 'effect',
    label: 'Effet',
    icon: '❄️',
    category: 'media',
    defaultContent: {
      effectImage: '❄️',
      effectSize: 20,
      effectTimer: 100,
      effectScale: 50,
      effectNbItems: 50,
      effectSpeed: 50,
      effectDirection: 'down',
    },
    defaultStyles: {
      margin: '0',
      padding: '0',
      height: '100px',
    },
  },
]

// Catégories pour l'affichage dans la palette
export const widgetCategories: { id: WidgetCategory, label: string }[] = [
  { id: 'base', label: 'Base' },
  { id: 'structure', label: 'Structure' },
  { id: 'form', label: 'Formulaire' },
  { id: 'media', label: 'Média' },
  { id: 'wellpack', label: 'Wellpack' },
  { id: 'action', label: 'Actions' },
]

export function getWidgetConfig(type: string): WidgetConfig | undefined {
  return widgetConfigs.find(config => config.type === type)
}

export function getWidgetsByCategory(category: WidgetCategory): WidgetConfig[] {
  return widgetConfigs.filter(config => config.category === category)
}

/**
 * Vérifie si un widget parent peut accepter un widget enfant
 * Règles :
 * 1. Le parent doit avoir canHaveChildren = true
 * 2. Si allowedChildren est défini, l'enfant doit être dans la liste
 * 3. Si disallowedChildren est défini, l'enfant ne doit pas être dans la liste
 */
export function canAcceptChild(parentType: WidgetType, childType: WidgetType): boolean {
  const parentConfig = getWidgetConfig(parentType)

  if (!parentConfig?.canHaveChildren) {
    return false
  }

  // Si allowedChildren est défini, seuls ces types sont autorisés
  if (parentConfig.allowedChildren && parentConfig.allowedChildren.length > 0) {
    return parentConfig.allowedChildren.includes(childType)
  }

  // Si disallowedChildren est défini, ces types sont interdits
  if (parentConfig.disallowedChildren && parentConfig.disallowedChildren.length > 0) {
    return !parentConfig.disallowedChildren.includes(childType)
  }

  // Par défaut, tout est autorisé si canHaveChildren est true
  return true
}

/**
 * Retourne la liste des widgets autorisés pour un parent donné
 */
export function getAllowedChildrenFor(parentType: WidgetType): WidgetType[] {
  const parentConfig = getWidgetConfig(parentType)

  if (!parentConfig?.canHaveChildren) {
    return []
  }

  // Si allowedChildren est défini explicitement
  if (parentConfig.allowedChildren && parentConfig.allowedChildren.length > 0) {
    return parentConfig.allowedChildren
  }

  // Sinon, retourner tous les types sauf les interdits
  const allTypes = widgetConfigs.map(c => c.type)

  if (parentConfig.disallowedChildren && parentConfig.disallowedChildren.length > 0) {
    return allTypes.filter(t => !parentConfig.disallowedChildren!.includes(t))
  }

  return allTypes
}

// Presets de colonnes pour création rapide
export const columnPresets = [
  { label: '2 colonnes (50/50)', columns: ['50%', '50%'] },
  { label: '2 colonnes (33/66)', columns: ['33%', '66%'] },
  { label: '2 colonnes (66/33)', columns: ['66%', '33%'] },
  { label: '3 colonnes (33/33/33)', columns: ['33%', '33%', '33%'] },
  { label: '3 colonnes (25/50/25)', columns: ['25%', '50%', '25%'] },
  { label: '4 colonnes', columns: ['25%', '25%', '25%', '25%'] },
]

// Presets de formulaires
export const formPresets = [
  {
    label: 'Contact rapide',
    fields: [
      { fieldType: 'text', label: 'Votre nom', required: true },
      { fieldType: 'email', label: 'Votre email', required: true },
      { fieldType: 'textarea', label: 'Votre message', required: true },
    ],
  },
  {
    label: 'Newsletter',
    fields: [
      { fieldType: 'email', label: 'Votre email', placeholder: 'Inscrivez-vous...', required: true },
    ],
  },
  {
    label: 'Inscription',
    fields: [
      { fieldType: 'text', label: 'Nom', required: true },
      { fieldType: 'text', label: 'Prénom', required: true },
      { fieldType: 'email', label: 'Email', required: true },
      { fieldType: 'tel', label: 'Téléphone', required: false },
    ],
  },
]
