import { z } from 'zod'

// =============================================================================
// SINGLE SOURCE OF TRUTH - Widget Type Definitions
// =============================================================================

export const WIDGET_TYPES = [
  // Base
  'title',
  'text',
  'image',
  'button',
  'separator',
  'spacer',
  'click-to-call',
  // Structure
  'row',
  'column',
  // Forms
  'form',
  'form-field',
  // Media
  'video',
  'map',
  'social',
  'icon',
  // Wellpack
  'barcode',
  'store-locator',
  'drive',
  'scratch',
  'flipcard',
  // Advanced
  'gallery',
  'slider',
  'link-image',
  'effect',
  // Phase 1 - Urgence & Social Proof
  'countdown',
  'testimonial',
  'badge',
] as const

export const widgetTypeSchema = z.enum(WIDGET_TYPES)
export type WidgetType = z.infer<typeof widgetTypeSchema>

export const WIDGET_CATEGORIES = [
  'content',
  'actions',
  'layout',
  'media',
  'interactive',
] as const

export const widgetCategorySchema = z.enum(WIDGET_CATEGORIES)
export type WidgetCategory = z.infer<typeof widgetCategorySchema>

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
  value: string | number
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
  caption?: string
  href?: string
}

export interface WidgetContent {
  // Base widgets
  text?: string
  src?: string
  alt?: string
  href?: string
  phone?: string
  email?: string
  action?: 'link' | 'tel' | 'email'
  icon?: string
  iconPosition?: 'start' | 'end'
  variant?: 'filled' | 'outline'

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
  submitAction?: 'submit' | 'link' | 'email' | 'tel'

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
  lat?: number
  lng?: number
  zoom?: number
  mapStyle?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'

  // Social widget
  socialLinks?: SocialLink[]
  socialStyle?: 'icons' | 'buttons' | 'pills' | 'text'
  socialSize?: 'small' | 'medium' | 'large'
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  youtube?: string
  whatsapp?: string
  tiktok?: string
  pinterest?: string

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
  images?: string[]

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
  effectDirection?: 'down' | 'up' | 'left' | 'right'

  // Countdown widget
  targetDate?: string
  expiredLabel?: string
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean

  // Testimonial widget
  quote?: string
  author?: string
  role?: string
  company?: string
  avatarUrl?: string
  rating?: number
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
  minWidth?: string
  widthMode?: 'auto' | 'full'

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

export interface WidgetDraft extends Partial<Omit<Widget, 'content' | 'styles' | 'children'>> {
  content?: Partial<WidgetContent>
  styles?: Partial<WidgetStyles>
  children?: WidgetDraft[]
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

/**
 * Example configuration for a widget, used for documentation and LLM guidance
 */
export interface WidgetExample {
  /** Description of this example use case */
  description: string
  /** Partial widget configuration showing the example */
  widget: WidgetDraft
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
