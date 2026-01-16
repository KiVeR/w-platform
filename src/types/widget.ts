export type WidgetType
  // Base
  = | 'title'
    | 'text'
    | 'image'
    | 'button'
    | 'separator'
    | 'spacer'
    | 'click-to-call'
  // Structure
    | 'row'
    | 'column'
  // Forms
    | 'form'
    | 'form-field'
  // Media
    | 'video'
    | 'map'
    | 'social'
    | 'icon'
  // Wellpack
    | 'barcode'
    | 'store-locator'
    | 'drive'
    | 'scratch'
    | 'flipcard'
  // Advanced
    | 'gallery'
    | 'slider'
    | 'link-image'
    | 'effect'

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
  fontSize?: string
  fontWeight?: string
  color?: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
  padding?: string
  margin?: string
  borderRadius?: string
  height?: string
  width?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderColor?: string
  borderWidth?: string
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
  palette: string
  backgroundColor: string
  textColor: string
  fontFamily?: string
}

export interface DesignDocument {
  version: string
  globalStyles: GlobalStyles
  widgets: Widget[]
}

export type WidgetCategory = 'base' | 'structure' | 'form' | 'media' | 'wellpack' | 'action'

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
}
