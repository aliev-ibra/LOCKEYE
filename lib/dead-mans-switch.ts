// Interface for dead man's switch settings
interface DeadMansSwitchSettings {
  enabled: boolean
  inactiveDays: number
  lastAccessTimestamp: number
  warningDays: number
  warningShown: boolean
}

// Dead man's switch manager
export class DeadMansSwitch {
  private static SETTINGS_KEY = "lockeye_dead_mans_switch"

  // Get dead man's switch settings
  static getSettings(): DeadMansSwitchSettings {
    const settingsJson = localStorage.getItem(this.SETTINGS_KEY)
    if (!settingsJson) {
      return {
        enabled: false,
        inactiveDays: 90, // Default to 90 days
        lastAccessTimestamp: Date.now(),
        warningDays: 7, // Default to 7 days warning
        warningShown: false,
      }
    }

    try {
      return JSON.parse(settingsJson)
    } catch (error) {
      return {
        enabled: false,
        inactiveDays: 90,
        lastAccessTimestamp: Date.now(),
        warningDays: 7,
        warningShown: false,
      }
    }
  }

  // Save dead man's switch settings
  static saveSettings(settings: DeadMansSwitchSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
  }

  // Update last access timestamp
  static updateLastAccess(): void {
    const settings = this.getSettings()
    settings.lastAccessTimestamp = Date.now()
    settings.warningShown = false
    this.saveSettings(settings)
  }

  // Check if the dead man's switch should be triggered
  static shouldTrigger(): boolean {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return false
    }

    const now = Date.now()
    const inactiveMs = now - settings.lastAccessTimestamp
    const inactiveDaysMs = settings.inactiveDays * 24 * 60 * 60 * 1000

    return inactiveMs >= inactiveDaysMs
  }

  // Check if a warning should be shown
  static shouldShowWarning(): boolean {
    const settings = this.getSettings()

    if (!settings.enabled || settings.warningShown) {
      return false
    }

    const now = Date.now()
    const inactiveMs = now - settings.lastAccessTimestamp
    const inactiveDaysMs = settings.inactiveDays * 24 * 60 * 60 * 1000
    const warningDaysMs = settings.warningDays * 24 * 60 * 60 * 1000

    return inactiveMs >= inactiveDaysMs - warningDaysMs
  }

  // Mark warning as shown
  static markWarningAsShown(): void {
    const settings = this.getSettings()
    settings.warningShown = true
    this.saveSettings(settings)
  }

  // Get days until trigger
  static getDaysUntilTrigger(): number {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return -1
    }

    const now = Date.now()
    const inactiveMs = now - settings.lastAccessTimestamp
    const inactiveDaysMs = settings.inactiveDays * 24 * 60 * 60 * 1000
    const remainingMs = inactiveDaysMs - inactiveMs

    return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)))
  }

  // Execute the dead man's switch
  static execute(): void {
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

