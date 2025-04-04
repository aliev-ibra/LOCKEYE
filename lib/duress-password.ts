import { Encryption } from "./encryption"

// Interface for duress mode settings
interface DuressSettings {
  enabled: boolean
  duressPassword: string
  realPassword: string
}

// Interface for fake vault entry
export interface FakeVaultEntry {
  id: string
  title: string
  username: string
  password: string
  url: string
  notes?: string
  category?: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}

// Duress password manager
export class DuressPassword {
  private static SETTINGS_KEY = "lockeye_duress_settings"
  private static FAKE_VAULT_KEY = "lockeye_fake_vault"
  private static SESSION_KEY = "lockeye_duress_session"

  // Check if duress mode is enabled
  static isDuressEnabled(): boolean {
    const settings = this.getSettings()
    return settings.enabled
  }

  // Get duress settings
  static getSettings(): DuressSettings {
    const settingsJson = localStorage.getItem(this.SETTINGS_KEY)
    if (!settingsJson) {
      return {
        enabled: false,
        duressPassword: "",
        realPassword: "",
      }
    }

    try {
      return JSON.parse(settingsJson)
    } catch (error) {
      return {
        enabled: false,
        duressPassword: "",
        realPassword: "",
      }
    }
  }

  // Save duress settings
  static async saveSettings(settings: DuressSettings): Promise<void> {
    // Encrypt the settings before saving
    const encryptedSettings = await Encryption.encrypt(JSON.stringify(settings), settings.realPassword)

    localStorage.setItem(this.SETTINGS_KEY, encryptedSettings)
  }

  // Check if a password is the duress password
  static async isDuressPassword(password: string): Promise<boolean> {
    if (!this.isDuressEnabled()) {
      return false
    }

    const encryptedSettings = localStorage.getItem(this.SETTINGS_KEY)
    if (!encryptedSettings) {
      return false
    }

    try {
      // Try to decrypt the settings with the provided password
      const settingsJson = await Encryption.decrypt(encryptedSettings, password)
      const settings = JSON.parse(settingsJson) as DuressSettings

      // Check if the provided password matches the duress password
      return settings.duressPassword === password
    } catch (error) {
      return false
    }
  }

  // Create a duress session
  static createDuressSession(): void {
    sessionStorage.setItem(this.SESSION_KEY, "true")
  }

  // Check if in duress mode
  static isInDuressMode(): boolean {
    return sessionStorage.getItem(this.SESSION_KEY) === "true"
  }

  // End duress session
  static endDuressSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY)
  }

  // Get fake vault entries
  static getFakeVaultEntries(): FakeVaultEntry[] {
    const entriesJson = localStorage.getItem(this.FAKE_VAULT_KEY)
    if (!entriesJson) {
      return this.generateDefaultFakeEntries()
    }

    try {
      return JSON.parse(entriesJson)
    } catch (error) {
      return this.generateDefaultFakeEntries()
    }
  }

  // Save fake vault entries
  static saveFakeVaultEntries(entries: FakeVaultEntry[]): void {
    localStorage.setItem(this.FAKE_VAULT_KEY, JSON.stringify(entries))
  }

  // Add a fake vault entry
  static addFakeEntry(entry: Omit<FakeVaultEntry, "id" | "createdAt" | "updatedAt">): FakeVaultEntry {
    const entries = this.getFakeVaultEntries()

    const newEntry: FakeVaultEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    entries.push(newEntry)
    this.saveFakeVaultEntries(entries)

    return newEntry
  }

  // Update a fake vault entry
  static updateFakeEntry(
    id: string,
    updates: Partial<Omit<FakeVaultEntry, "id" | "createdAt" | "updatedAt">>,
  ): FakeVaultEntry {
    const entries = this.getFakeVaultEntries()

    const entryIndex = entries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      throw new Error("Entry not found")
    }

    entries[entryIndex] = {
      ...entries[entryIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    this.saveFakeVaultEntries(entries)

    return entries[entryIndex]
  }

  // Delete a fake vault entry
  static deleteFakeEntry(id: string): void {
    const entries = this.getFakeVaultEntries()

    const entryIndex = entries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      throw new Error("Entry not found")
    }

    entries.splice(entryIndex, 1)
    this.saveFakeVaultEntries(entries)
  }

  // Generate default fake entries
  private static generateDefaultFakeEntries(): FakeVaultEntry[] {
    const now = Date.now()

    return [
      {
        id: crypto.randomUUID(),
        title: "Gmail",
        username: "user@gmail.com",
        password: "Password123!",
        url: "https://gmail.com",
        createdAt: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        updatedAt: now - 15 * 24 * 60 * 60 * 1000, // 15 days ago
      },
      {
        id: crypto.randomUUID(),
        title: "Facebook",
        username: "user@example.com",
        password: "Facebook2023!",
        url: "https://facebook.com",
        createdAt: now - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        updatedAt: now - 20 * 24 * 60 * 60 * 1000, // 20 days ago
      },
      {
        id: crypto.randomUUID(),
        title: "Amazon",
        username: "user@example.com",
        password: "AmazonShopping#1",
        url: "https://amazon.com",
        createdAt: now - 45 * 24 * 60 * 60 * 1000, // 45 days ago
        updatedAt: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      },
    ]
  }
}

