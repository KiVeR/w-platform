import type { UserPalette, UserPalettesStorage } from '#shared/schemas/palette.schema'
import { userPalettesStorageSchema } from '#shared/schemas/palette.schema'

const STORAGE_KEY = 'lpe_user_palettes'
const MAX_PALETTES = 50
const CURRENT_VERSION = 1

export interface StorageError {
  type: 'quota_exceeded' | 'storage_disabled' | 'parse_error' | 'validation_error' | 'limit_exceeded'
  message: string
  originalError?: Error
}

export type StorageResult<T>
  = | { success: true, data: T }
    | { success: false, error: StorageError }

export const userPalettesService = {
  isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    }
    catch {
      return false
    }
  },

  loadPalettes(): StorageResult<UserPalette[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        return { success: true, data: [] }
      }

      const parsed = JSON.parse(raw)
      const validated = userPalettesStorageSchema.safeParse(parsed)

      if (!validated.success) {
        console.warn('Invalid user palettes data, attempting migration:', validated.error.flatten())
        return this.migrateOrReset(parsed)
      }

      return { success: true, data: validated.data.palettes }
    }
    catch (error) {
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: {
            type: 'parse_error',
            message: 'Données corrompues dans le stockage local',
            originalError: error,
          },
        }
      }
      return {
        success: false,
        error: {
          type: 'storage_disabled',
          message: 'Le stockage local n\'est pas disponible',
          originalError: error as Error,
        },
      }
    }
  },

  savePalettes(palettes: UserPalette[]): StorageResult<void> {
    if (palettes.length > MAX_PALETTES) {
      return {
        success: false,
        error: {
          type: 'limit_exceeded',
          message: `Maximum ${MAX_PALETTES} palettes autorisées`,
        },
      }
    }

    try {
      const data: UserPalettesStorage = {
        version: CURRENT_VERSION,
        palettes,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return { success: true, data: undefined }
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: {
            type: 'quota_exceeded',
            message: 'Espace de stockage insuffisant',
            originalError: error,
          },
        }
      }
      return {
        success: false,
        error: {
          type: 'storage_disabled',
          message: 'Impossible d\'écrire dans le stockage local',
          originalError: error as Error,
        },
      }
    }
  },

  generateId(): string {
    return `user_${crypto.randomUUID()}`
  },

  migrateOrReset(data: unknown): StorageResult<UserPalette[]> {
    // Try to migrate from old format (array without wrapper)
    if (Array.isArray(data)) {
      const migrated: UserPalette[] = []
      const now = new Date().toISOString()

      for (const item of data) {
        if (typeof item === 'object' && item !== null && 'name' in item && 'primary' in item) {
          migrated.push({
            id: this.generateId(),
            name: String(item.name || ''),
            label: String(item.label || item.name || ''),
            primary: String(item.primary || '#14b8a6'),
            primaryDark: String(item.primaryDark || '#0d9488'),
            background: String(item.background || '#ffffff'),
            text: String(item.text || '#1e293b'),
            isDark: Boolean(item.isDark),
            createdAt: now,
            updatedAt: now,
            version: 1,
          })
        }
      }

      if (migrated.length > 0) {
        const saveResult = this.savePalettes(migrated)
        if (saveResult.success) {
          console.warn(`Migrated ${migrated.length} palettes to new format`)
          return { success: true, data: migrated }
        }
      }
    }

    // Migration failed, reset to empty
    console.warn('Migration failed, resetting user palettes')
    this.savePalettes([])
    return { success: true, data: [] }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
