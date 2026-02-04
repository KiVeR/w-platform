// Re-export WidgetType from the single source of truth
export type { WidgetCategory, WidgetType } from '#shared/widgets/definitions'

export type FormFieldType
  = | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'date'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'textarea'

export interface SelectOption {
  value: string
  label: string
}

export type SocialPlatform
  = | 'facebook' | 'instagram' | 'twitter' | 'linkedin'
    | 'youtube' | 'tiktok' | 'whatsapp' | 'telegram' | 'email'

export interface SocialLink {
  platform: SocialPlatform
  url: string
  enabled: boolean
}

export interface StoreLocation {
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  openingHours?: string
}

export interface GalleryImage {
  src: string
  alt?: string
}

export interface WidgetContent {
  // Base widgets
  text?: string
  src?: string
  alt?: string
  href?: string
  phone?: string
  action?: 'link' | 'tel' | 'email'

  // Row/Column
  gap?: string
  align?: 'start' | 'center' | 'end' | 'stretch' | 'space-between'
  wrap?: boolean
  columnWidth?: string // For column: '50%', '33%', 'auto'

  // Form container
  redirectUrl?: string
  successMessage?: string
  emailNotify?: boolean
  emailSubject?: string
  emailTo?: string
  submitText?: string

  // Form field
  fieldType?: FormFieldType
  label?: string
  placeholder?: string
  required?: boolean
  validation?: 'email' | 'phone' | 'date' | 'numeric' | 'custom'
  validationPattern?: string
  validationMessage?: string
  minLength?: number
  maxLength?: number
  options?: SelectOption[] // For select, radio
  defaultValue?: string
  name?: string

  // Video widget
  videoUrl?: string
  videoProvider?: 'youtube' | 'vimeo' | 'custom'
  videoId?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean

  // Map widget
  address?: string
  latitude?: number
  longitude?: number
  zoom?: number
  mapStyle?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'

  // Social widget
  socialLinks?: SocialLink[]
  socialStyle?: 'icons' | 'buttons' | 'pills'
  socialSize?: 'small' | 'medium' | 'large'

  // Icon widget
  iconName?: string
  iconLibrary?: 'emoji' | 'lucide'
  iconSize?: string
  iconColor?: string

  // Barcode widget
  barcodeCode?: string
  barcodeType?: 'ean13' | 'ean8'
  barcodeColor?: string
  barcodeVariable?: string // Support variables ${barcode}

  // Store Locator widget
  storeLocatorLabel?: string
  storeLocatorButtonText?: string
  storeLocatorButtonColor?: string
  storeLocatorStores?: StoreLocation[]

  // Drive widget
  driveButtonText?: string
  driveButtonColor?: string
  driveStores?: StoreLocation[]
  driveBtnGoLabel?: string
  driveBtnCallLabel?: string
  driveBtnGoColor?: string
  driveBtnCallColor?: string

  // Scratch widget
  scratchImageFg?: string
  scratchImageBg?: string
  scratchSize?: number
  scratchPercent?: number
  scratchLink?: string

  // Flipcard widget
  flipcardImageFront?: string
  flipcardImageBack?: string
  flipcardLink?: string

  // Gallery widget
  galleryImages?: GalleryImage[]
  galleryButtonText?: string

  // Slider widget
  sliderImages?: GalleryImage[]
  sliderInterval?: number
  sliderChevronColor?: string
  sliderAutoplay?: boolean

  // Link-image widget
  linkImageSrc?: string
  linkImageAlt?: string
  linkImageHref?: string

  // Effect widget
  effectImage?: string
  effectSize?: number
  effectTimer?: number
  effectScale?: number
  effectNbItems?: number
  effectSpeed?: number
  effectDirection?: 'down' | 'up'
}

export interface WidgetStyles {
  // Typography
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'

  // Colors
  color?: string
  backgroundColor?: string

  // Layout
  textAlign?: 'left' | 'center' | 'right'
  padding?: string
  margin?: string
  height?: string
  width?: string
  maxWidth?: string

  // Border
  borderRadius?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderColor?: string
  borderWidth?: string

  // Visual Effects
  boxShadow?: string
  opacity?: string

  // Flexbox for row/column
  display?: 'flex' | 'block' | 'inline' | 'inline-block' | 'grid' | 'none'
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap?: string
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  flex?: string

  [key: string]: string | undefined
}

export interface Widget {
  id: string
  type: WidgetType
  order: number
  content: WidgetContent
  styles: WidgetStyles
  children?: Widget[] // For containers: row, column, form
}

export interface GlobalStyles {
  // Theme
  palette: string
  backgroundColor: string
  textColor: string

  // Brand colors
  primaryColor?: string
  secondaryColor?: string

  // Typography
  fontFamily?: string
  headingFontFamily?: string
  baseFontSize?: string
  lineHeight?: string

  // Layout
  contentPadding?: string
  widgetGap?: string
  borderRadius?: string

  // SEO
  pageTitle?: string
  metaDescription?: string
}

export interface DesignDocument {
  version: string
  globalStyles: GlobalStyles
  widgets: Widget[]
}

// WidgetCategory is re-exported from definitions.ts at the top of this file

/**
 * Example configuration for a widget, used for documentation and LLM guidance
 */
export interface WidgetExample {
  /** Description of this example use case */
  description: string
  /** Partial widget configuration showing the example */
  widget: Partial<Widget>
}

export interface WidgetConfig {
  type: WidgetType
  label: string
  icon: string
  category: WidgetCategory
  defaultContent: WidgetContent
  defaultStyles: WidgetStyles
  canHaveChildren?: boolean
  allowedChildren?: WidgetType[] // Si défini, seuls ces types sont autorisés
  disallowedChildren?: WidgetType[] // Types explicitement interdits

  // Documentation for LLM and UI
  /** Semantic description of the widget purpose and use cases (in English for LLM) */
  description?: string
  /** Usage hints and best practices for the LLM */
  usageHints?: string[]
  /** Required content properties that must be provided */
  requiredContent?: (keyof WidgetContent)[]
  /** Example configurations showing proper usage */
  examples?: WidgetExample[]
}
