import type { Widget } from '@/types/widget'

/**
 * Determine si un widget est configure (a du contenu utile a afficher).
 * Les widgets non configures sont masques en mode apercu.
 */
export function isWidgetConfigured(widget: Widget): boolean {
  switch (widget.type) {
    case 'image':
      return !!widget.content.src?.trim()

    case 'link-image':
      return !!widget.content.linkImageSrc?.trim()

    case 'video':
      return !!widget.content.videoUrl?.trim()

    case 'map':
      return !!widget.content.address?.trim()
        || !!(widget.content.latitude && widget.content.longitude)

    case 'barcode':
      return !!widget.content.barcodeCode?.trim()

    case 'gallery':
      return !!(widget.content.galleryImages?.length)

    case 'slider':
      return !!(widget.content.sliderImages?.length)

    case 'icon':
      return !!widget.content.iconName?.trim()

    case 'social':
      return (widget.content.socialLinks || [])
        .some(link => link.enabled && link.url?.trim())

    case 'scratch':
      return !!(widget.content.scratchImageFg?.trim() && widget.content.scratchImageBg?.trim())

    case 'flipcard':
      return !!(widget.content.flipcardImageFront?.trim() && widget.content.flipcardImageBack?.trim())

    case 'effect':
      return !!widget.content.effectImage?.trim()

    case 'store-locator':
      return !!(widget.content.storeLocatorStores?.length)

    case 'drive':
      return !!(widget.content.driveStores?.length)

    // Containers : verifier si au moins un enfant est configure
    case 'row':
    case 'column':
    case 'form':
      return hasConfiguredChildren(widget)

    // Widgets toujours configures (texte, titre, bouton, separateur, spacer, click-to-call, form-field)
    default:
      return true
  }
}

/**
 * Verifie si un widget container a au moins un enfant configure.
 */
export function hasConfiguredChildren(widget: Widget): boolean {
  if (!widget.children?.length) {
    return false
  }
  return widget.children.some(child => isWidgetConfigured(child))
}

/**
 * Filtre les widgets pour ne garder que ceux qui sont configures.
 */
export function filterConfiguredWidgets(widgets: Widget[]): Widget[] {
  return widgets.filter(isWidgetConfigured)
}
