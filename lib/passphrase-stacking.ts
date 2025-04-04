import { Encryption } from "./encryption"

// Interface for passphrase stacking settings
interface PassphraseStackingSettings {
  enabled: boolean
  requiredPhrases: string[]
  enteredPhrases: string[]
}

// Passphrase stacking manager
export class PassphraseStacking {
  private static SETTINGS_KEY = "lockeye_passphrase_stacking"
  private static SESSION_KEY = "lockeye_passphrase_stacking_session"

  // Get passphrase stacking settings
  static getSettings(): PassphraseStackingSettings {
    const settingsJson = localStorage.getItem(this.SETTINGS_KEY)
    if (!settingsJson) {
      return {
        enabled: false,
        requiredPhrases: [],
        enteredPhrases: [],
      }
    }

    try {
      return JSON.parse(settingsJson)
    } catch (error) {
      return {
        enabled: false,
        requiredPhrases: [],
        enteredPhrases: [],
      }
    }
  }

  // Save passphrase stacking settings
  static async saveSettings(settings: PassphraseStackingSettings, masterPassword: string): Promise<void> {
    // Encrypt the settings before saving
    const encryptedSettings = await Encryption.encrypt(JSON.stringify(settings), masterPassword)

    localStorage.setItem(this.SETTINGS_KEY, encryptedSettings)
  }

  // Enable passphrase stacking
  static async enablePassphraseStacking(phrases: string[], masterPassword: string): Promise<void> {
    if (phrases.length < 2) {
      throw new Error("At least 2 passphrases are required")
    }

    await this.saveSettings(
      {
        enabled: true,
        requiredPhrases: phrases,
        enteredPhrases: [],
      },
      masterPassword,
    )
  }

  // Disable passphrase stacking
  static async disablePassphraseStacking(masterPassword: string): Promise<void> {
    await this.saveSettings(
      {
        enabled: false,
        requiredPhrases: [],
        enteredPhrases: [],
      },
      masterPassword,
    )
  }

  // Check if passphrase stacking is enabled
  static async isEnabled(masterPassword: string): Promise<boolean> {
    try {
      const encryptedSettings = localStorage.getItem(this.SETTINGS_KEY)
      if (!encryptedSettings) {
        return false
      }

      const settingsJson = await Encryption.decrypt(encryptedSettings, masterPassword)
      const settings = JSON.parse(settingsJson) as PassphraseStackingSettings

      return settings.enabled
    } catch (error) {
      return false
    }
  }

  // Enter a passphrase
  static enterPassphrase(phrase: string): void {
    const sessionData = this.getSessionData()

    if (!sessionData.enteredPhrases.includes(phrase)) {
      sessionData.enteredPhrases.push(phrase)
      this.saveSessionData(sessionData)
    }
  }

  // Check if all required passphrases have been entered
  static async areAllPhrasesEntered(masterPassword: string): Promise<boolean> {
    try {
      const encryptedSettings = localStorage.getItem(this.SETTINGS_KEY)
      if (!encryptedSettings) {
        return true // If no settings, consider it complete
      }

      const settingsJson = await Encryption.decrypt(encryptedSettings, masterPassword)
      const settings = JSON.parse(settingsJson) as PassphraseStackingSettings

      if (!settings.enabled) {
        return true // If not enabled, consider it complete
      }

      const sessionData = this.getSessionData()

      // Check if all required phrases have been entered
      return settings.requiredPhrases.every((phrase) => sessionData.enteredPhrases.includes(phrase))
    } catch (error) {
      return false
    }
  }

  // Get the next required passphrase
  static async getNextRequiredPassphrase(masterPassword: string): Promise<string | null> {
    try {
      const encryptedSettings = localStorage.getItem(this.SETTINGS_KEY)
      if (!encryptedSettings) {
        return null
      }

      const settingsJson = await Encryption.decrypt(encryptedSettings, masterPassword)
      const settings = JSON.parse(settingsJson) as PassphraseStackingSettings

      if (!settings.enabled) {
        return null
      }

      const sessionData = this.getSessionData()

      // Find the first required phrase that hasn't been entered yet
      const nextPhrase = settings.requiredPhrases.find((phrase) => !sessionData.enteredPhrases.includes(phrase))

      return nextPhrase || null
    } catch (error) {
      return null
    }
  }

  // Reset entered passphrases
  static resetEnteredPhrases(): void {
    this.saveSessionData({
      enteredPhrases: [],
    })
  }

  // Get session data
  private static getSessionData(): { enteredPhrases: string[] } {
    const sessionDataJson = sessionStorage.getItem(this.SESSION_KEY)
    if (!sessionDataJson) {
      return {
        enteredPhrases: [],
      }
    }

    try {
      return JSON.parse(sessionDataJson)
    } catch (error) {
      return {
        enteredPhrases: [],
      }
    }
  }

  // Save session data
  private static saveSessionData(data: { enteredPhrases: string[] }): void {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(data))
  }
}

