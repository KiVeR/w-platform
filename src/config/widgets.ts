import type { WidgetConfig, WidgetCategory, WidgetType } from '@/types/widget'

export const widgetConfigs: WidgetConfig[] = [
  // ==================== BASE ====================
  {
    type: 'title',
    label: 'Titre',
    icon: 'T',
    category: 'base',
    defaultContent: { text: 'Mon titre' },
    defaultStyles: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      textAlign: 'center',
      padding: '16px',
      margin: '0'
    }
  },
  {
    type: 'text',
    label: 'Texte',
    icon: '¶',
    category: 'base',
    defaultContent: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    defaultStyles: {
      fontSize: '16px',
      color: '#475569',
      textAlign: 'left',
      padding: '12px 16px',
      margin: '0'
    }
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼',
    category: 'base',
    defaultContent: {
      src: 'https://via.placeholder.com/300x200',
      alt: 'Image'
    },
    defaultStyles: {
      width: '100%',
      borderRadius: '8px',
      padding: '8px',
      margin: '0'
    }
  },
  {
    type: 'button',
    label: 'Bouton',
    icon: '▢',
    category: 'action',
    defaultContent: {
      text: 'Cliquez ici',
      action: 'link',
      href: '#'
    },
    defaultStyles: {
      backgroundColor: '#14b8a6',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
      padding: '12px 24px',
      margin: '8px 16px',
      borderRadius: '8px'
    }
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
      padding: '0'
    }
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
      padding: '0'
    }
  },
  {
    type: 'click-to-call',
    label: 'Click to Call',
    icon: '📞',
    category: 'action',
    defaultContent: {
      text: 'Appeler',
      phone: '+33123456789',
      action: 'tel'
    },
    defaultStyles: {
      backgroundColor: '#14b8a6',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
      padding: '12px 24px',
      margin: '8px 16px',
      borderRadius: '8px'
    }
  },

  // ==================== STRUCTURE ====================
  {
    type: 'row',
    label: 'Colonnes',
    icon: '▥',
    category: 'structure',
    canHaveChildren: true,
    allowedChildren: ['column'],
    defaultContent: {
      gap: '16px',
      align: 'stretch',
      wrap: true
    },
    defaultStyles: {
      display: 'flex',
      flexDirection: 'row',
      gap: '16px',
      flexWrap: 'wrap',
      padding: '8px',
      margin: '0'
    }
  },
  {
    type: 'column',
    label: 'Colonne',
    icon: '▯',
    category: 'structure',
    canHaveChildren: true,
    disallowedChildren: ['row', 'column'], // Évite la récursion infinie de grids
    defaultContent: {
      columnWidth: '50%'
    },
    defaultStyles: {
      flex: '1',
      minWidth: '0',
      padding: '8px'
    }
  },

  // ==================== FORMULAIRES ====================
  {
    type: 'form',
    label: 'Formulaire',
    icon: '📋',
    category: 'form',
    canHaveChildren: true,
    disallowedChildren: ['form'], // Un form ne peut pas contenir un autre form
    defaultContent: {
      redirectUrl: '',
      successMessage: 'Merci ! Votre message a bien été envoyé.',
      emailNotify: false,
      emailSubject: 'Nouveau message',
      emailTo: ''
    },
    defaultStyles: {
      padding: '16px',
      margin: '0',
      backgroundColor: '#f8fafc',
      borderRadius: '8px'
    }
  },
  {
    type: 'form-field',
    label: 'Champ',
    icon: '⎕',
    category: 'form',
    defaultContent: {
      fieldType: 'text',
      label: 'Votre nom',
      placeholder: '',
      required: false,
      name: ''
    },
    defaultStyles: {
      margin: '0 0 16px 0',
      padding: '0'
    }
  },

  // ==================== MÉDIA ====================
  {
    type: 'video',
    label: 'Vidéo',
    icon: '🎬',
    category: 'media',
    defaultContent: {
      videoUrl: '',
      videoProvider: 'youtube',
      autoplay: false,
      muted: false,
      loop: false,
      controls: true
    },
    defaultStyles: {
      margin: '0',
      padding: '8px',
      borderRadius: '8px'
    }
  },
  {
    type: 'map',
    label: 'Carte',
    icon: '📍',
    category: 'media',
    defaultContent: {
      address: '',
      zoom: 15,
      mapStyle: 'roadmap'
    },
    defaultStyles: {
      margin: '0',
      padding: '8px',
      borderRadius: '8px'
    }
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
        { platform: 'whatsapp', url: '', enabled: false }
      ],
      socialStyle: 'icons',
      socialSize: 'medium'
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '8px',
      textAlign: 'center'
    }
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
      href: ''
    },
    defaultStyles: {
      margin: '8px 0',
      padding: '8px',
      textAlign: 'center'
    }
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
      barcodeVariable: ''
    },
    defaultStyles: {
      margin: '16px auto',
      padding: '8px',
      textAlign: 'center'
    }
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
      storeLocatorStores: []
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '16px',
      textAlign: 'center'
    }
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
      driveBtnGoLabel: "S'y rendre",
      driveBtnCallLabel: 'Appeler',
      driveBtnGoColor: '#14b8a6',
      driveBtnCallColor: '#6366f1'
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '16px',
      textAlign: 'center'
    }
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
      scratchLink: ''
    },
    defaultStyles: {
      margin: '16px auto',
      padding: '0',
      textAlign: 'center'
    }
  },
  {
    type: 'flipcard',
    label: 'Carte retournable',
    icon: '🔄',
    category: 'wellpack',
    defaultContent: {
      flipcardImageFront: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Recto',
      flipcardImageBack: 'https://via.placeholder.com/300x200/22c55e/ffffff?text=Verso',
      flipcardLink: ''
    },
    defaultStyles: {
      margin: '16px auto',
      padding: '0',
      textAlign: 'center'
    }
  },

  // ==================== AVANCÉ ====================
  {
    type: 'gallery',
    label: 'Galerie',
    icon: '🖼️',
    category: 'media',
    defaultContent: {
      galleryImages: [],
      galleryButtonText: 'Voir la galerie'
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '8px',
      textAlign: 'center'
    }
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
      sliderAutoplay: true
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '0',
      textAlign: 'center'
    }
  },
  {
    type: 'link-image',
    label: 'Image lien',
    icon: '🔗',
    category: 'base',
    defaultContent: {
      linkImageSrc: 'https://via.placeholder.com/300x200',
      linkImageAlt: 'Image',
      linkImageHref: ''
    },
    defaultStyles: {
      margin: '8px 0',
      padding: '0',
      textAlign: 'center'
    }
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
      effectDirection: 'down'
    },
    defaultStyles: {
      margin: '0',
      padding: '0',
      height: '100px'
    }
  }
]

// Catégories pour l'affichage dans la palette
export const widgetCategories: { id: WidgetCategory; label: string }[] = [
  { id: 'base', label: 'Base' },
  { id: 'structure', label: 'Structure' },
  { id: 'form', label: 'Formulaire' },
  { id: 'media', label: 'Média' },
  { id: 'wellpack', label: 'Wellpack' },
  { id: 'action', label: 'Actions' }
]

export const getWidgetConfig = (type: string): WidgetConfig | undefined => {
  return widgetConfigs.find(config => config.type === type)
}

export const getWidgetsByCategory = (category: WidgetCategory): WidgetConfig[] => {
  return widgetConfigs.filter(config => config.category === category)
}

/**
 * Vérifie si un widget parent peut accepter un widget enfant
 * Règles :
 * 1. Le parent doit avoir canHaveChildren = true
 * 2. Si allowedChildren est défini, l'enfant doit être dans la liste
 * 3. Si disallowedChildren est défini, l'enfant ne doit pas être dans la liste
 */
export const canAcceptChild = (parentType: WidgetType, childType: WidgetType): boolean => {
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
export const getAllowedChildrenFor = (parentType: WidgetType): WidgetType[] => {
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
  { label: '4 colonnes', columns: ['25%', '25%', '25%', '25%'] }
]

// Presets de formulaires
export const formPresets = [
  {
    label: 'Contact rapide',
    fields: [
      { fieldType: 'text', label: 'Votre nom', required: true },
      { fieldType: 'email', label: 'Votre email', required: true },
      { fieldType: 'textarea', label: 'Votre message', required: true }
    ]
  },
  {
    label: 'Newsletter',
    fields: [
      { fieldType: 'email', label: 'Votre email', placeholder: 'Inscrivez-vous...', required: true }
    ]
  },
  {
    label: 'Inscription',
    fields: [
      { fieldType: 'text', label: 'Nom', required: true },
      { fieldType: 'text', label: 'Prénom', required: true },
      { fieldType: 'email', label: 'Email', required: true },
      { fieldType: 'tel', label: 'Téléphone', required: false }
    ]
  }
]
