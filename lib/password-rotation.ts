import { VaultManager, type PasswordEntry } from "./vault"
import { Encryption } from "./encryption"

// Interface for password rotation settings
interface PasswordRotationSettings {
  enabled: boolean
  intervalDays: number
  minStrength: number
  excludedIds: string[]
}

// Password rotation manager
export class PasswordRotation {
  private static SETTINGS_KEY = "lockeye_password_rotation_settings"
  private static LAST_ROTATION_KEY = "lockeye_last_rotation"

  // Get password rotation settings
  static getSettings(): PasswordRotationSettings {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        intervalDays: 90,
        minStrength: 70,
        excludedIds: [],
      };
    }
    
    const settingsJson = localStorage.getItem(this.SETTINGS_KEY)
    if (!settingsJson) {
      return {
        enabled: false,
        intervalDays: 90, // Default to 90 days
        minStrength: 70, // Default to minimum strength of 70
        excludedIds: [],
      }
    }
  
    try {
      return JSON.parse(settingsJson)
    } catch (error) {
      return {
        enabled: false,
        intervalDays: 90,
        minStrength: 70,
        excludedIds: [],
      }
    }
  }

  // Save password rotation settings
  static saveSettings(settings: PasswordRotationSettings): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
  }

  // Get the date of the last rotation
  static getLastRotation(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    const lastRotation = localStorage.getItem(this.LAST_ROTATION_KEY)
    return lastRotation ? Number.parseInt(lastRotation, 10) : 0
  }

  // Set the date of the last rotation
  static setLastRotation(timestamp: number): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(this.LAST_ROTATION_KEY, timestamp.toString())
  }

  // Check if password rotation is due
  static isRotationDue(): boolean {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return false
    }

    const lastRotation = this.getLastRotation()
    const now = Date.now()
    const intervalMs = settings.intervalDays * 24 * 60 * 60 * 1000

    return now - lastRotation >= intervalMs
  }

  // Get passwords that need rotation
  static async getPasswordsNeedingRotation(): Promise<PasswordEntry[]> {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return []
    }

    try {
      const allEntries = await VaultManager.getAllEntries()
      const now = Date.now()
      const intervalMs = settings.intervalDays * 24 * 60 * 60 * 1000

      return allEntries.filter((entry) => {
        // Skip excluded passwords
        if (settings.excludedIds.includes(entry.id)) {
          return false
        }

        // Check if the password is old enough to need rotation
        const passwordAge = now - entry.updatedAt

        // Check if the password strength is below the minimum
        const strength = Encryption.calculatePasswordStrength(entry.password)

        return passwordAge >= intervalMs || strength < settings.minStrength
      })
    } catch (error) {
      console.error("Failed to get passwords needing rotation:", error)
      return []
    }
  }

  // Rotate a password
  static async rotatePassword(entry: PasswordEntry): Promise<PasswordEntry> {
    // Generate a new strong password
    const newPassword = Encryption.generatePassword(16, true, true, true, true)

    // Update the password
    const updatedEntry = await VaultManager.updateEntry(entry.id, {
      password: newPassword,
    })

    return updatedEntry
  }

  // Perform automatic password rotation
  static async performAutoRotation(): Promise<{
    rotated: PasswordEntry[]
    failed: PasswordEntry[]
  }> {
    const passwordsToRotate = await this.getPasswordsNeedingRotation()

    const rotated: PasswordEntry[] = []
    const failed: PasswordEntry[] = []

    for (const entry of passwordsToRotate) {
      try {
        const updatedEntry = await this.rotatePassword(entry)
        rotated.push(updatedEntry)
      } catch (error) {
        failed.push(entry)
      }
    }

    // Update the last rotation timestamp
    if (rotated.length > 0) {
      this.setLastRotation(Date.now())
    }

    return { rotated, failed }
  }

  // Exclude a password from rotation
  static excludePassword(passwordId: string): void {
    const settings = this.getSettings()

    if (!settings.excludedIds.includes(passwordId)) {
      settings.excludedIds.push(passwordId)
      this.saveSettings(settings)
    }
  }

  // Include a previously excluded password in rotation
  static includePassword(passwordId: string): void {
    const settings = this.getSettings()

    const index = settings.excludedIds.indexOf(passwordId)
    if (index !== -1) {
      settings.excludedIds.splice(index, 1)
      this.saveSettings(settings)
    }
  }
}

