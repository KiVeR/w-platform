import { userPalettesService } from '../services/persistence/userPalettes'

// Singleton state for cross-component sync
const userPalettes = shallowRef<UserPalette[]>([])
const showSaveModal = ref(false)
const showConfirmModal = ref(false)
const pendingPalette = ref<Palette | UserPalette | null>(null)
const skipConfirmation = ref(false)
const storageError = ref<string | null>(null)
let isInitialized = false

export function usePalettes() {
  const editorStore = useEditorStore()

  function initialize() {
    if (isInitialized)
      return

    const result = userPalettesService.loadPalettes()
    if (result.success) {
      userPalettes.value = result.data
    }
    else {
      storageError.value = result.error.message
      console.warn('Failed to load user palettes:', result.error)
    }

    isInitialized = true
  }

  const currentColors = computed(() => ({
    backgroundColor: editorStore.globalStyles.backgroundColor ?? '#ffffff',
    textColor: editorStore.globalStyles.textColor ?? '#1e293b',
    primaryColor: editorStore.globalStyles.primaryColor ?? '#14b8a6',
    secondaryColor: editorStore.globalStyles.secondaryColor ?? '#0d9488',
  }))

  const selectedPalette = computed((): Palette | UserPalette | undefined => {
    const paletteName = editorStore.globalStyles.palette
    if (!paletteName)
      return undefined

    // Check user palettes first
    const userPalette = userPalettes.value.find(p => p.name === paletteName)
    if (userPalette)
      return userPalette

    // Then check predefined
    return getPaletteByName(paletteName)
  })

  const isUserPalette = computed(() => {
    const palette = selectedPalette.value
    return palette ? 'id' in palette && 'createdAt' in palette : false
  })

  // Modification detection with memoization
  const selectedPaletteColorHash = computed(() => {
    const p = selectedPalette.value
    if (!p)
      return ''
    return colorHash({
      background: p.background,
      text: p.text,
      primary: p.primary,
      primaryDark: p.primaryDark,
    })
  })

  const currentColorHash = computed(() => {
    return colorHash({
      background: currentColors.value.backgroundColor,
      text: currentColors.value.textColor,
      primary: currentColors.value.primaryColor,
      primaryDark: currentColors.value.secondaryColor,
    })
  })

  const isPaletteModified = computed(() => {
    if (!selectedPalette.value)
      return false
    return selectedPaletteColorHash.value !== currentColorHash.value
  })

  // Palette selection
  function selectPalette(palette: Palette | UserPalette) {
    if (isPaletteModified.value && !skipConfirmation.value) {
      pendingPalette.value = palette
      showConfirmModal.value = true
      return
    }
    applyPalette(palette)
  }

  function applyPalette(palette: Palette | UserPalette) {
    editorStore.updateGlobalStyles({
      palette: palette.name,
      backgroundColor: palette.background,
      textColor: palette.text,
      primaryColor: palette.primary,
      secondaryColor: palette.primaryDark,
    })
  }

  function confirmPaletteChange(dontAskAgain = false) {
    if (dontAskAgain) {
      skipConfirmation.value = true
    }
    if (pendingPalette.value) {
      applyPalette(pendingPalette.value)
      pendingPalette.value = null
    }
    showConfirmModal.value = false
  }

  function cancelPaletteChange() {
    pendingPalette.value = null
    showConfirmModal.value = false
  }

  function resetToOriginal() {
    const palette = selectedPalette.value
    if (palette) {
      applyPalette(palette)
    }
  }

  // Save palette
  function openSaveModal() {
    showSaveModal.value = true
  }

  function closeSaveModal() {
    showSaveModal.value = false
  }

  function saveAsNewPalette(label: string): boolean {
    const now = new Date().toISOString()
    const newPalette: UserPalette = {
      id: userPalettesService.generateId(),
      name: `user_${Date.now()}`,
      label,
      primary: currentColors.value.primaryColor,
      primaryDark: currentColors.value.secondaryColor,
      background: currentColors.value.backgroundColor,
      text: currentColors.value.textColor,
      isDark: isDarkColor(currentColors.value.backgroundColor),
      createdAt: now,
      updatedAt: now,
      version: 1,
    }

    const updatedPalettes = [...userPalettes.value, newPalette]
    const result = userPalettesService.savePalettes(updatedPalettes)

    if (result.success) {
      userPalettes.value = updatedPalettes
      editorStore.updateGlobalStyles({ palette: newPalette.name })
      closeSaveModal()
      return true
    }
    else {
      storageError.value = result.error.message
      return false
    }
  }

  function updateCurrentPalette(): boolean {
    const palette = selectedPalette.value
    if (!palette || !('id' in palette))
      return false

    const updatedPalettes = userPalettes.value.map((p) => {
      if (p.id === palette.id) {
        return {
          ...p,
          primary: currentColors.value.primaryColor,
          primaryDark: currentColors.value.secondaryColor,
          background: currentColors.value.backgroundColor,
          text: currentColors.value.textColor,
          isDark: isDarkColor(currentColors.value.backgroundColor),
          updatedAt: new Date().toISOString(),
        }
      }
      return p
    })

    const result = userPalettesService.savePalettes(updatedPalettes)

    if (result.success) {
      userPalettes.value = updatedPalettes
      return true
    }
    else {
      storageError.value = result.error.message
      return false
    }
  }

  function duplicatePalette(palette: Palette | UserPalette): boolean {
    const now = new Date().toISOString()
    const newPalette: UserPalette = {
      id: userPalettesService.generateId(),
      name: `user_${Date.now()}`,
      label: `${palette.label} (copie)`,
      primary: palette.primary,
      primaryDark: palette.primaryDark,
      background: palette.background,
      text: palette.text,
      isDark: palette.isDark,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }

    const updatedPalettes = [...userPalettes.value, newPalette]
    const result = userPalettesService.savePalettes(updatedPalettes)

    if (result.success) {
      userPalettes.value = updatedPalettes
      return true
    }
    else {
      storageError.value = result.error.message
      return false
    }
  }

  function renamePalette(id: string, newLabel: string): boolean {
    const updatedPalettes = userPalettes.value.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          label: newLabel,
          updatedAt: new Date().toISOString(),
        }
      }
      return p
    })

    const result = userPalettesService.savePalettes(updatedPalettes)

    if (result.success) {
      userPalettes.value = updatedPalettes
      return true
    }
    else {
      storageError.value = result.error.message
      return false
    }
  }

  function deleteUserPalette(id: string): boolean {
    const paletteToDelete = userPalettes.value.find(p => p.id === id)
    if (!paletteToDelete)
      return false

    const updatedPalettes = userPalettes.value.filter(p => p.id !== id)
    const result = userPalettesService.savePalettes(updatedPalettes)

    if (result.success) {
      userPalettes.value = updatedPalettes

      // If deleted palette was selected, switch to first preset
      if (editorStore.globalStyles.palette === paletteToDelete.name) {
        const fallbackPalette = palettes[0]
        if (fallbackPalette)
          applyPalette(fallbackPalette)
      }
      return true
    }
    else {
      storageError.value = result.error.message
      return false
    }
  }

  // Cross-tab sync
  function handleStorageChange(event: StorageEvent) {
    if (event.key === 'lpe_user_palettes' && event.newValue) {
      const result = userPalettesService.loadPalettes()
      if (result.success) {
        userPalettes.value = result.data
      }
    }
  }

  function setupStorageSync() {
    window.addEventListener('storage', handleStorageChange)
  }

  function cleanupStorageSync() {
    window.removeEventListener('storage', handleStorageChange)
  }

  onMounted(() => {
    initialize()
    setupStorageSync()
  })

  onUnmounted(() => {
    cleanupStorageSync()
  })

  return {
    userPalettes,
    presetPalettes: palettes,
    showSaveModal,
    showConfirmModal,
    pendingPalette,
    storageError,
    currentColors,
    selectedPalette,
    isPaletteModified,
    isUserPalette,
    selectPalette,
    applyPalette,
    confirmPaletteChange,
    cancelPaletteChange,
    resetToOriginal,
    openSaveModal,
    closeSaveModal,
    saveAsNewPalette,
    updateCurrentPalette,
    duplicatePalette,
    renamePalette,
    deleteUserPalette,
    initialize,
  }
}
