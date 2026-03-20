export const widgetConfigs: WidgetConfig[] = [
  // ==================== CONTENU ====================
  {
    type: 'title',
    label: 'Titre',
    icon: 'T',
    category: 'content',
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
    category: 'content',
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
    icon: 'Image',
    category: 'content',
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
      src: '',
      alt: '',
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
    icon: 'MousePointerClick',
    category: 'actions',
    description: 'Interactive button with customizable action. Supports navigation links (href), phone calls (tel:), and email (mailto:). Use for CTAs, form submission, and user actions. Supports optional Lucide icon (prefix or suffix).',
    usageHints: [
      'Always provide descriptive button text (not just "Click here")',
      'Use action="link" for navigation, action="tel" for phone calls',
      'Ensure href/phone property matches the action type',
      'Place buttons after explanatory content, not before',
      'Add icon for visual emphasis (e.g., ArrowRight, Phone, Download)',
    ],
    requiredContent: ['text', 'action'],
    examples: [
      {
        description: 'CTA button with icon',
        widget: {
          type: 'button',
          content: { text: 'Découvrir nos offres', action: 'link', href: 'https://example.com/offers', icon: 'ArrowRight', iconPosition: 'end' },
          styles: { backgroundColor: '#3b82f6', color: '#ffffff' },
        },
      },
      {
        description: 'Phone call button with icon',
        widget: {
          type: 'button',
          content: { text: 'Appelez-nous', action: 'tel', phone: '+33123456789', icon: 'Phone', iconPosition: 'start' },
          styles: { backgroundColor: '#22c55e', color: '#ffffff' },
        },
      },
    ],
    defaultContent: {
      text: 'Cliquez ici',
      action: 'link',
      href: '',
      icon: '',
      iconPosition: 'start',
    },
    defaultStyles: {
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
    category: 'content',
    description: 'Horizontal line divider. Use to visually separate sections of content. Supports customizable style, color, and thickness.',
    usageHints: [
      'Use between distinct content sections',
      'Keep styling subtle to avoid visual clutter',
      'Consider using spacer instead if you just need vertical space',
    ],
    examples: [
      {
        description: 'Subtle section divider',
        widget: {
          type: 'separator',
          styles: { borderColor: '#e2e8f0', borderWidth: '1px', margin: '24px 16px' },
        },
      },
    ],
    defaultContent: {},
    defaultStyles: {
      borderStyle: 'solid',
      borderWidth: '1px',
      margin: '16px',
      padding: '0',
    },
  },
  {
    type: 'spacer',
    label: 'Espace',
    icon: 'MoveVertical',
    category: 'content',
    description: 'Invisible vertical spacing element. Use to add breathing room between widgets without a visible line. Height is fully customizable.',
    usageHints: [
      'Use for adding vertical space between content blocks',
      'Prefer margin/padding on widgets when possible',
      'Useful for fine-tuning layout without affecting other styles',
    ],
    examples: [
      {
        description: 'Large spacer between sections',
        widget: {
          type: 'spacer',
          styles: { height: '48px' },
        },
      },
    ],
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
    icon: 'Phone',
    category: 'actions',
    description: 'Phone call button optimized for mobile. Tapping opens the phone dialer with the configured number. Use for customer support, sales hotlines, or direct contact. Displays Lucide icon (default: Phone).',
    usageHints: [
      'Use international format for phone numbers (+33...)',
      'Provide clear button text indicating the action',
      'Place prominently for easy mobile access',
      'Change icon to PhoneCall, Smartphone, or Headphones for variety',
    ],
    requiredContent: ['phone'],
    examples: [
      {
        description: 'Customer support hotline',
        widget: {
          type: 'click-to-call',
          content: { text: 'Service client', phone: '+33800123456', action: 'tel', icon: 'Phone' },
          styles: { backgroundColor: '#22c55e', color: '#ffffff' },
        },
      },
    ],
    defaultContent: {
      text: 'Appeler',
      phone: '+33123456789',
      action: 'tel',
      icon: 'Phone',
      iconPosition: 'start',
    },
    defaultStyles: {
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
      padding: '12px 24px',
      margin: '8px 16px',
      borderRadius: '8px',
    },
  },

  // ==================== MISE EN PAGE ====================
  {
    type: 'row',
    label: 'Colonnes',
    icon: '▥',
    category: 'layout',
    description: 'Horizontal layout container. Creates a row that can only contain column widgets. Supports background images for hero sections, background color, border-radius, and per-side borders.',
    usageHints: [
      'Row can ONLY contain column widgets as direct children',
      'Use 2-4 columns for most layouts',
      'On mobile, columns will stack vertically (responsive)',
      'Add widgets inside columns, not directly in rows',
      'Use backgroundImage (url(...)) for full-width hero sections',
      'Supports backgroundColor, borderRadius, boxShadow for section styling',
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
    category: 'layout',
    description: 'Vertical container inside a row. Holds any widget type except row/column. Supports background images for hero overlays, card styling (backgroundColor, borderRadius, boxShadow), and accent borders (borderLeft, etc.).',
    usageHints: [
      'Columns must be placed inside a row widget',
      'Cannot contain row or column (prevents infinite nesting)',
      'Use columnWidth to set relative width (e.g., "33%", "50%", "66%")',
      'Use backgroundImage (url(...)) + backgroundSize: cover for hero sections with overlaid content',
      'Use backgroundColor + borderRadius + boxShadow for card effects',
      'Use borderLeft/borderRight for accent borders (e.g., "3px solid #d4a041")',
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
    icon: 'ClipboardList',
    category: 'layout',
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
    category: 'layout',
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
    icon: 'Video',
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
    icon: 'MapPin',
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
    icon: 'Share2',
    category: 'media',
    description: 'Social media links bar. Displays icons linking to your social profiles. Supports Facebook, Instagram, Twitter/X, LinkedIn, YouTube, WhatsApp, and more.',
    usageHints: [
      'Enable only platforms where you have active profiles',
      'Use full URLs including https://',
      'Place in footer or contact sections',
      'Choose icon size based on visual hierarchy',
    ],
    examples: [
      {
        description: 'Social links bar',
        widget: {
          type: 'social',
          content: {
            socialLinks: [
              { platform: 'facebook', url: 'https://facebook.com/mypage', enabled: true },
              { platform: 'instagram', url: 'https://instagram.com/myprofile', enabled: true },
            ],
            socialStyle: 'icons',
            socialSize: 'medium',
          },
        },
      },
    ],
    defaultContent: {
      socialLinks: [
        { platform: 'facebook', url: '', enabled: true },
        { platform: 'instagram', url: '', enabled: true },
        { platform: 'twitter', url: '', enabled: false },
        { platform: 'linkedin', url: '', enabled: false },
        { platform: 'youtube', url: '', enabled: false },
        { platform: 'tiktok', url: '', enabled: false },
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
    icon: 'Star',
    category: 'content',
    description: 'Single decorative or functional icon using Lucide library. Can be linked to make it clickable. Great for visual accents in feature lists.',
    usageHints: [
      'Use Lucide icon names (PascalCase): Star, Phone, Mail, Heart, Check, etc.',
      'Set iconColor to match your color scheme',
      'Add href to make the icon clickable',
      'Use in row/column layouts for feature grids',
    ],
    examples: [
      {
        description: 'Feature icon with link',
        widget: {
          type: 'icon',
          content: { iconName: 'Mail', iconSize: '48px', iconColor: '#3b82f6', href: 'mailto:contact@example.com' },
        },
      },
    ],
    defaultContent: {
      iconName: 'Star',
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

  // ==================== INTERACTIF ====================
  {
    type: 'barcode',
    label: 'Code barre',
    icon: 'Barcode',
    category: 'interactive',
    description: 'Barcode generator for coupons and loyalty programs. Supports EAN-13, Code128, QR codes, and more. Can use dynamic variables for personalized codes.',
    usageHints: [
      'Use EAN-13 for retail product codes (13 digits)',
      'Use Code128 for alphanumeric codes',
      'Use barcodeVariable for dynamic personalized codes',
      'Ensure sufficient contrast with barcodeColor',
    ],
    requiredContent: ['barcodeCode', 'barcodeType'],
    examples: [
      {
        description: 'EAN-13 coupon code',
        widget: {
          type: 'barcode',
          content: { barcodeCode: '5901234123457', barcodeType: 'ean13', barcodeColor: '#000000' },
        },
      },
    ],
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
    icon: 'Store',
    category: 'interactive',
    description: 'Interactive store finder. Displays a list of locations users can browse. Links to external map or dedicated store locator page.',
    usageHints: [
      'Add store addresses in storeLocatorStores array',
      'Customize button text and color to match brand',
      'Use for retail, restaurants, or service locations',
      'Consider drive widget for geolocation-based nearest store',
    ],
    examples: [
      {
        description: 'Retail store locator',
        widget: {
          type: 'store-locator',
          content: {
            storeLocatorLabel: 'Trouvez un magasin',
            storeLocatorButtonText: 'Voir la carte',
            storeLocatorButtonColor: '#3b82f6',
          },
        },
      },
    ],
    defaultContent: {
      storeLocatorLabel: 'Nos magasins',
      storeLocatorButtonText: 'Voir tous les lieux',
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
    icon: 'Car',
    category: 'interactive',
    description: 'Geolocation-based nearest store finder. Uses user location to find and display the closest store with directions and call options. Ideal for drive-to-store campaigns.',
    usageHints: [
      'Configure driveStores with store addresses and coordinates',
      'Customize button labels for navigation and call actions',
      'Requires user permission for geolocation',
      'Provide fallback store-locator for users who deny location access',
    ],
    examples: [
      {
        description: 'Drive-to-store CTA',
        widget: {
          type: 'drive',
          content: {
            driveButtonText: 'Magasin le plus proche',
            driveButtonColor: '#22c55e',
            driveBtnGoLabel: 'Itinéraire',
            driveBtnCallLabel: 'Appeler',
          },
        },
      },
    ],
    defaultContent: {
      driveButtonText: 'Trouver le magasin le plus proche',
      driveStores: [],
      driveBtnGoLabel: 'S\'y rendre',
      driveBtnCallLabel: 'Appeler',
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
    icon: 'Sparkles',
    category: 'interactive',
    description: 'Interactive scratch card for gamification. Users scratch the foreground to reveal a hidden image or prize beneath. Great for promotions, contests, and engagement campaigns.',
    usageHints: [
      'Use scratchImageFg for the scratchable overlay',
      'Use scratchImageBg for the revealed content (prize, code, message)',
      'Set scratchPercent to control how much must be scratched to reveal',
      'Add scratchLink to redirect after reveal',
    ],
    requiredContent: ['scratchImageFg', 'scratchImageBg'],
    examples: [
      {
        description: 'Promotional scratch card',
        widget: {
          type: 'scratch',
          content: {
            scratchImageFg: 'https://example.com/scratch-overlay.png',
            scratchImageBg: 'https://example.com/prize-reveal.png',
            scratchPercent: 70,
            scratchLink: 'https://example.com/claim-prize',
          },
        },
      },
    ],
    defaultContent: {
      scratchImageFg: 'https://picsum.photos/seed/scratch-fg/300/200',
      scratchImageBg: 'https://picsum.photos/seed/scratch-bg/300/200',
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
    icon: 'FlipHorizontal',
    category: 'interactive',
    description: 'Interactive flip card with front and back faces. Users tap or click to flip and reveal the back side. Ideal for before/after, product info, or teaser reveals.',
    usageHints: [
      'Use flipcardImageFront for the initial visible side',
      'Use flipcardImageBack for the hidden side revealed on flip',
      'Add flipcardLink to make the card clickable after flip',
      'Keep both images the same dimensions for smooth animation',
    ],
    requiredContent: ['flipcardImageFront', 'flipcardImageBack'],
    examples: [
      {
        description: 'Product reveal flip card',
        widget: {
          type: 'flipcard',
          content: {
            flipcardImageFront: 'https://example.com/teaser.png',
            flipcardImageBack: 'https://example.com/product-reveal.png',
            flipcardLink: 'https://example.com/product',
          },
        },
      },
    ],
    defaultContent: {
      flipcardImageFront: 'https://picsum.photos/seed/flipcard-front/300/200',
      flipcardImageBack: 'https://picsum.photos/seed/flipcard-back/300/200',
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
    icon: 'Images',
    category: 'media',
    description: 'Image gallery with lightbox viewer. Renders as a label header + responsive 3-column thumbnail grid. Each image can have a caption overlay. Ideal for product photos, portfolios, hotel rooms, or event galleries. Provide 4-6 images for best visual result.',
    usageHints: [
      'Add 4-6 images to galleryImages array with src, alt, and caption',
      'Use square images (1:1 ratio) for a clean grid',
      'Set galleryButtonText as the gallery section label',
      'Use caption for short descriptions shown as overlay on thumbnails',
    ],
    examples: [
      {
        description: 'Hotel photo gallery',
        widget: {
          type: 'gallery',
          content: {
            galleryImages: [
              { src: 'https://placehold.co/600x600?text=Hall', alt: 'Hotel lobby', caption: 'Hall d\'entrée' },
              { src: 'https://placehold.co/600x600?text=Chambre', alt: 'Deluxe room', caption: 'Chambre Deluxe' },
              { src: 'https://placehold.co/600x600?text=Piscine', alt: 'Swimming pool', caption: 'Piscine' },
              { src: 'https://placehold.co/600x600?text=Restaurant', alt: 'Restaurant', caption: 'Restaurant' },
              { src: 'https://placehold.co/600x600?text=Spa', alt: 'Spa area', caption: 'Spa' },
              { src: 'https://placehold.co/600x600?text=Terrasse', alt: 'Terrace', caption: 'Terrasse' },
            ],
            galleryButtonText: 'Nos espaces',
          },
        },
      },
    ],
    defaultContent: {
      galleryImages: [],
      galleryButtonText: 'Galerie photos',
    },
    defaultStyles: {
      margin: '16px 0',
      padding: '8px',
    },
  },
  {
    type: 'slider',
    label: 'Carrousel',
    icon: 'SlidersHorizontal',
    category: 'media',
    description: 'Automatic image carousel/slideshow. Displays images in sequence with configurable timing and navigation arrows. Use for hero banners, product showcases, or promotional content.',
    usageHints: [
      'Add images to sliderImages array with src, alt, and optional link',
      'Set sliderInterval in milliseconds (3000 = 3 seconds)',
      'Enable sliderAutoplay for automatic rotation',
      'Customize sliderChevronColor to match your design',
    ],
    examples: [
      {
        description: 'Hero banner carousel',
        widget: {
          type: 'slider',
          content: {
            sliderImages: [
              { src: 'https://example.com/banner1.jpg', alt: 'Promo 1' },
              { src: 'https://example.com/banner2.jpg', alt: 'Promo 2' },
            ],
            sliderInterval: 4000,
            sliderAutoplay: true,
          },
        },
      },
    ],
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
    icon: 'Link2',
    category: 'actions',
    description: 'Clickable image that links to a URL. Combines image display with navigation. Use for promotional banners, sponsor logos, or any image that should be a link.',
    usageHints: [
      'Always provide linkImageAlt for accessibility',
      'Use linkImageHref for the destination URL',
      'Consider using for banner ads or promotional images',
      'Prefer standard image widget if no link is needed',
    ],
    requiredContent: ['linkImageSrc', 'linkImageHref'],
    examples: [
      {
        description: 'Promotional banner link',
        widget: {
          type: 'link-image',
          content: {
            linkImageSrc: 'https://example.com/promo-banner.jpg',
            linkImageAlt: 'Summer Sale - 50% off',
            linkImageHref: 'https://example.com/summer-sale',
          },
        },
      },
    ],
    defaultContent: {
      linkImageSrc: 'https://picsum.photos/seed/link-image/300/200',
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
    icon: 'Snowflake',
    category: 'interactive',
    description: 'Animated particle effect overlay. Creates falling/floating elements (snow, confetti, hearts, etc.) for festive or celebratory pages. Use sparingly for visual impact.',
    usageHints: [
      'Use emoji or small image for effectImage',
      'Control density with effectNbItems (lower = subtler)',
      'Set effectDirection: "down" for falling, "up" for rising',
      'Use sparingly - too many effects can distract users',
    ],
    examples: [
      {
        description: 'Snowfall effect for winter campaign',
        widget: {
          type: 'effect',
          content: {
            effectImage: '❄️',
            effectNbItems: 30,
            effectSpeed: 40,
            effectDirection: 'down',
          },
          styles: { height: '150px' },
        },
      },
      {
        description: 'Confetti celebration effect',
        widget: {
          type: 'effect',
          content: {
            effectImage: '🎉',
            effectNbItems: 20,
            effectSpeed: 60,
            effectDirection: 'down',
          },
        },
      },
    ],
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

  // ==================== PHASE 1 - URGENCE & SOCIAL PROOF ====================
  {
    type: 'countdown',
    label: 'Compte à rebours',
    icon: 'Timer',
    category: 'interactive',
    description: 'Countdown timer showing time remaining until a target date. Creates urgency for promotions, events, or deadlines.',
    usageHints: [
      'Place below hero or pricing for maximum impact',
      'Use for promo end dates, event deadlines, stock limits',
      'Combine with Badge widget for "LIMITED TIME" effect',
    ],
    requiredContent: ['targetDate'],
    examples: [
      {
        description: 'Promo countdown',
        widget: {
          type: 'countdown',
          content: {
            targetDate: '2026-12-31T23:59:59',
            label: 'Offre expire dans',
            expiredLabel: 'Offre terminée',
          },
          styles: {},
        },
      },
    ],
    defaultContent: {
      targetDate: '',
      label: 'Fin de l\'offre dans',
      expiredLabel: 'Offre terminée',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    defaultStyles: {
      margin: '16px',
      padding: '16px',
      textAlign: 'center',
    },
  },
  {
    type: 'testimonial',
    label: 'Témoignage',
    icon: 'MessageSquareQuote',
    category: 'content',
    description: 'Customer testimonial with quote, author, optional avatar and star rating. Essential for social proof.',
    usageHints: [
      'Place after product/service description',
      'Include rating for e-commerce and reviews',
      'Use avatar for personal touch',
    ],
    requiredContent: ['quote', 'author'],
    examples: [
      {
        description: 'Customer review with rating',
        widget: {
          type: 'testimonial',
          content: {
            quote: 'Excellent service !',
            author: 'Marie D.',
            rating: 5,
            role: 'Cliente depuis 2024',
          },
          styles: {},
        },
      },
    ],
    defaultContent: {
      quote: '',
      author: '',
      role: '',
      avatarUrl: '',
      rating: 0,
      company: '',
    },
    defaultStyles: {
      margin: '16px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
    },
  },
  {
    type: 'badge',
    label: 'Badge',
    icon: 'Tag',
    category: 'content',
    description: 'Small label/tag for promotions, status indicators, or categories. Use for "NEW", "-30%", "BEST SELLER", etc.',
    usageHints: [
      'Place inside Row with image for overlay effect',
      'Use filled variant for promos, outline for categories',
      'Keep text short (1-3 words max)',
    ],
    requiredContent: ['text'],
    examples: [
      {
        description: 'Promo badge',
        widget: {
          type: 'badge',
          content: {
            text: '-30%',
            variant: 'filled',
          },
          styles: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
          },
        },
      },
    ],
    defaultContent: {
      text: '',
      variant: 'filled',
    },
    defaultStyles: {
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      backgroundColor: '#ef4444',
      color: '#ffffff',
    },
  },
]

// Catégories pour l'affichage dans la palette
export const widgetCategories: { id: WidgetCategory, label: string }[] = [
  { id: 'content', label: 'Contenu' },
  { id: 'actions', label: 'Actions' },
  { id: 'layout', label: 'Mise en page' },
  { id: 'media', label: 'Médias' },
  { id: 'interactive', label: 'Interactif' },
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
