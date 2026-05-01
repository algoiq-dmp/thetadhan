/* ═══════════════════════════════════════════════════════════
   LIGHT Z — Auto-Backup & Restore System
   Saves all app state to localStorage, keeps last 5 backups
   ═══════════════════════════════════════════════════════════ */

const BACKUP_PREFIX = 'lightz-backup-'
const MAX_BACKUPS = 5

/** Collect all Light Z state into a single object */
function collectState() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('lightz-') && !key.startsWith(BACKUP_PREFIX)) {
      keys.push(key)
    }
  }
  const state = {}
  keys.forEach(k => {
    try { state[k] = localStorage.getItem(k) } catch {}
  })
  return state
}

/** Create a backup snapshot */
export function createBackup(label = 'auto') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupKey = `${BACKUP_PREFIX}${timestamp}`
  const data = {
    label,
    timestamp: new Date().toISOString(),
    state: collectState(),
    version: '1.0.0',
  }
  localStorage.setItem(backupKey, JSON.stringify(data))
  pruneOldBackups()
  return backupKey
}

/** Remove oldest backups if over MAX_BACKUPS */
function pruneOldBackups() {
  const backups = getBackupList()
  if (backups.length > MAX_BACKUPS) {
    const toRemove = backups.slice(MAX_BACKUPS)
    toRemove.forEach(b => localStorage.removeItem(b.key))
  }
}

/** Get list of all backups, sorted newest first */
export function getBackupList() {
  const backups = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(BACKUP_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        backups.push({
          key,
          label: data.label || 'auto',
          timestamp: data.timestamp,
          stateKeys: Object.keys(data.state || {}).length,
        })
      } catch {}
    }
  }
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/** Restore a backup by key */
export function restoreBackup(backupKey) {
  try {
    const data = JSON.parse(localStorage.getItem(backupKey))
    if (!data?.state) return false
    // Clear current lightz state
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('lightz-') && !k.startsWith(BACKUP_PREFIX)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    // Restore saved state
    Object.entries(data.state).forEach(([k, v]) => localStorage.setItem(k, v))
    return true
  } catch { return false }
}

/** Delete a specific backup */
export function deleteBackup(backupKey) {
  localStorage.removeItem(backupKey)
}

/** Check if auto-backup is enabled in settings */
export function isAutoBackupEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem('lightz-settings'))
    return settings?.autoBackup !== false
  } catch { return true }
}

/** Setup beforeunload handler for auto-backup */
export function setupAutoBackup() {
  window.addEventListener('beforeunload', () => {
    if (isAutoBackupEnabled()) {
      createBackup('auto-exit')
    }
  })
}
