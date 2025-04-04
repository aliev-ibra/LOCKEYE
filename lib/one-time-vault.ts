// Interface for one-time vault settings
interface OneTimeVaultSettings {
  enabled: boolean
  accessCount: number
}

// One-time vault manager
export class OneTimeVault {
  private static SETTINGS_KEY = "lockeye_one_time_vault"

  // Get one-time vault settings
  static getSettings(): OneTimeVaultSettings {
    const settingsJson = localStorage.getItem(this.SETTINGS_KEY)
    if (!settingsJson) {
      return {
        enabled: false,
        accessCount: 0,
      }
    }

    try {
      return JSON.parse(settingsJson)
    } catch (error) {
      return {
        enabled: false,
        accessCount: 0,
      }
    }
  }

  // Save one-time vault settings
  static saveSettings(settings: OneTimeVaultSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
  }

  // Enable one-time vault mode
  static enableOneTimeVault(): void {
    this.saveSettings({
      enabled: true,
      accessCount: 0,
    })
  }

  // Disable one-time vault mode
  static disableOneTimeVault(): void {
    this.saveSettings({
      enabled: false,
      accessCount: 0,
    })
  }

  // Record vault access
  static recordAccess(): boolean {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return false
    }

    settings.accessCount++
    this.saveSettings(settings)

    // Return true if this was the first access
    return settings.accessCount === 1
  }

  // Check if the vault should self-destruct
  static shouldSelfDestruct(): boolean {
    const settings = this.getSettings()

    return settings.enabled && settings.accessCount > 1
  }

  // Execute self-destruct
  static executeSelfDestruct(): void {
    // In a real implementation, this would securely wipe all data
    // For this demo, we'll just clear localStorage

    // Get all keys that start with 'lockeye_'
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("lockeye_")) {
        keys.push(key)
      }
    }

    // Remove all lockeye data
    keys.forEach((key) => localStorage.removeItem(key))

    // Clear session storage as well
    sessionStorage.clear()
  }
}

