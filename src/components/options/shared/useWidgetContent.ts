import type { Widget, WidgetContent } from '@/types/widget'
import { useWidgetsStore } from '@/stores/widgets'

export function useWidgetContent(widget: Widget) {
  const widgetsStore = useWidgetsStore()

  function updateContent<K extends keyof WidgetContent>(key: K, value: WidgetContent[K]): void {
    widgetsStore.updateWidgetContent(widget.id, { [key]: value })
  }

  function updateStyles(styles: Record<string, any>): void {
    widgetsStore.updateWidgetStyles(widget.id, styles)
  }

  return {
    updateContent,
    updateStyles,
  }
}
