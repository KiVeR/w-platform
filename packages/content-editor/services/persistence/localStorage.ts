const STORAGE_PREFIX = 'lpe_'
const BACKUP_KEY = (id: number) => `${STORAGE_PREFIX}backup_${id}`
const META_KEY = (id: number) => `${STORAGE_PREFIX}meta_${id}`

export interface BackupMeta {
  landingPageId: number
  savedAt: string
  isDirty: boolean
  version: string
  widgetCount: number
}

export interface BackupData {
  design: DesignDocument
  meta: BackupMeta
}

export const localStorageService = {
  saveBackup(id: number, design: DesignDocument, isDirty: boolean): void {
    try {
      const backup = JSON.stringify(design)
      const meta: BackupMeta = {
        landingPageId: id,
        savedAt: new Date().toISOString(),
        isDirty,
        version: design.version,
        widgetCount: design.widgets.length,
      }

      localStorage.setItem(BACKUP_KEY(id), backup)
      localStorage.setItem(META_KEY(id), JSON.stringify(meta))
    }
    catch (error) {
      console.warn('Erreur sauvegarde localStorage:', error)
    }
  },

  loadBackup(id: number): BackupData | null {
    try {
      const backup = localStorage.getItem(BACKUP_KEY(id))
      const metaStr = localStorage.getItem(META_KEY(id))

      if (!backup || !metaStr)
        return null

      return {
        design: JSON.parse(backup),
        meta: JSON.parse(metaStr),
      }
    }
    catch (error) {
      console.warn('Erreur chargement localStorage:', error)
      return null
    }
  },

  hasNewerBackup(id: number, serverLastModified: string | null): boolean {
    const backup = this.loadBackup(id)
    if (!backup)
      return false

    if (!serverLastModified)
      return backup.meta.isDirty

    const backupDate = new Date(backup.meta.savedAt).getTime()
    const serverDate = new Date(serverLastModified).getTime()

    return backup.meta.isDirty && backupDate > serverDate
  },

  clearBackup(id: number): void {
    localStorage.removeItem(BACKUP_KEY(id))
    localStorage.removeItem(META_KEY(id))
  },

  listBackups(): BackupMeta[] {
    const backups: BackupMeta[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`${STORAGE_PREFIX}meta_`)) {
        try {
          const meta = JSON.parse(localStorage.getItem(key) || '')
          backups.push(meta)
        }
        catch { /* ignore */ }
      }
    }

    return backups
  },

  cleanOldBackups(maxAgeDays = 7): void {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000

    for (const meta of this.listBackups()) {
      if (new Date(meta.savedAt).getTime() < cutoff) {
        this.clearBackup(meta.landingPageId)
      }
    }
  },
}
