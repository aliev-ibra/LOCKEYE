import { Encryption } from "./encryption"

// Password entry interface
export interface PasswordEntry {
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
  expiresAt?: number // For time-limited passwords
}

// Vault interface
export interface Vault {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  entries: PasswordEntry[]
}

// Vault manager class
export class VaultManager {
  private static VAULT_KEY = "lockeye_vault"
  private static SESSION_KEY = "lockeye_session"
  private static AUTO_LOCK_KEY = "lockeye_auto_lock"
  private static autoLockTimeout: NodeJS.Timeout | null = null

  // Default auto-lock time in minutes
  private static DEFAULT_AUTO_LOCK_TIME = 5

  // Get auto-lock time
  static getAutoLockTime(): number {
    if (typeof window === 'undefined') {
      return this.DEFAULT_AUTO_LOCK_TIME;
    }
    const storedTime = localStorage.getItem(this.AUTO_LOCK_KEY)
    return storedTime ? Number.parseInt(storedTime, 10) : this.DEFAULT_AUTO_LOCK_TIME
  }

  // Set auto-lock time
  static setAutoLockTime(minutes: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.AUTO_LOCK_KEY, minutes.toString())
  }

  // Check if the vault exists
  static vaultExists(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.VAULT_KEY) !== null
  }

  // Create a session (store the master password temporarily)
  private static createSession(masterPassword: string): void {
    if (typeof window === 'undefined') return;
    // In a real app, you might want to encrypt this or use a more secure approach
    // This is a simplified implementation for demonstration
    sessionStorage.setItem(this.SESSION_KEY, masterPassword)
    sessionStorage.setItem('vault_unlocked', 'true');

    // Set up auto-lock
    this.setupAutoLock()
  }

  // Set up auto-lock
  private static setupAutoLock(): void {
    if (typeof window === 'undefined') return;
    
    const lockTime = this.getAutoLockTime() * 60 * 1000 // Convert minutes to milliseconds

    // Reset the timer on user activity
    const resetTimer = () => {
      if (this.autoLockTimeout) {
        clearTimeout(this.autoLockTimeout)
      }
      this.autoLockTimeout = setTimeout(() => this.lock(), lockTime)
    }

    // Set up event listeners for user activity
    ;["mousedown", "keydown", "touchstart", "scroll"].forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Initial timer
    resetTimer()
  }

  // Lock the vault
  static lock(): void {
    if (typeof window === 'undefined') return;
    
    // Clear the session
    sessionStorage.removeItem(this.SESSION_KEY)
    sessionStorage.removeItem('vault_unlocked')
    
    // Clear the auto-lock timeout
    if (this.autoLockTimeout) {
      clearTimeout(this.autoLockTimeout)
      this.autoLockTimeout = null
    }
    
    // Remove event listeners (optional, but good practice)
    ;["mousedown", "keydown", "touchstart", "scroll"].forEach((event) => {
      window.removeEventListener(event, () => {})
    })
  }

  // Get the master password from the session
  private static getMasterPassword(): string {
    if (typeof window === 'undefined') {
      throw new Error("Vault is locked")
    }
    const password = sessionStorage.getItem(this.SESSION_KEY)
    if (!password) {
      throw new Error("Vault is locked")
    }
    return password
  }

  // Load the vault
  static async loadVault(): Promise<Vault> {
    if (typeof window === 'undefined') {
      throw new Error("No vault found")
    }
    const encryptedVault = localStorage.getItem(this.VAULT_KEY)
    if (!encryptedVault) {
      throw new Error("No vault found")
    }

    try {
      const masterPassword = this.getMasterPassword()
      const decryptedVault = await Encryption.decrypt(encryptedVault, masterPassword)
      return JSON.parse(decryptedVault) as Vault
    } catch (error) {
      throw new Error("Failed to load vault")
    }
  }

  // Save the vault
  static async saveVault(vault: Vault): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const masterPassword = this.getMasterPassword()
      vault.updatedAt = Date.now()
      const encryptedVault = await Encryption.encrypt(JSON.stringify(vault), masterPassword)
      localStorage.setItem(this.VAULT_KEY, encryptedVault)
    } catch (error) {
      throw new Error("Failed to save vault")
    }
  }

  // Create a backup of the vault
  static async createBackup(): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error("No vault found")
    }
    const encryptedVault = localStorage.getItem(this.VAULT_KEY)
    if (!encryptedVault) {
      throw new Error("No vault found")
    }

    return encryptedVault
  }

  // Restore a backup
  static async restoreBackup(backup: string, masterPassword: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      // Try to decrypt the backup to verify it's valid
      await Encryption.decrypt(backup, masterPassword)

      // If successful, save the backup
      localStorage.setItem(this.VAULT_KEY, backup)

      // Create a session
      this.createSession(masterPassword)
    } catch (error) {
      throw new Error("Invalid backup or incorrect password")
    }
  }

  // Clear clipboard after a delay
  static clearClipboardAfterDelay(seconds = 30): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      navigator.clipboard.writeText("")
    }, seconds * 1000)
  }

  // Create a new vault
  static async createVault(masterPassword: string, name = "My Vault"): Promise<void> {
    const newVault: Vault = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      entries: [],
    }

    // Encrypt and save the vault
    const encryptedVault = await Encryption.encrypt(JSON.stringify(newVault), masterPassword)
    localStorage.setItem(this.VAULT_KEY, encryptedVault)

    // Create a session
    this.createSession(masterPassword)
  }

  // Unlock the vault
  static async unlockVault(masterPassword: string): Promise<boolean> {
    const encryptedVault = localStorage.getItem(this.VAULT_KEY)
    if (!encryptedVault) {
      throw new Error("No vault found")
    }

    try {
      // Try to decrypt the vault to verify the password
      await Encryption.decrypt(encryptedVault, masterPassword)

      // If successful, create a session
      this.createSession(masterPassword)
      return true
    } catch (error) {
      return false
    }
  }

  // Add a password entry
  static async addEntry(entry: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">): Promise<PasswordEntry> {
    const vault = await this.loadVault()

    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    vault.entries.push(newEntry)
    await this.saveVault(vault)

    return newEntry
  }

  // Update a password entry
  static async updateEntry(
    id: string,
    updates: Partial<Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PasswordEntry> {
    const vault = await this.loadVault()

    const entryIndex = vault.entries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      throw new Error("Entry not found")
    }

    vault.entries[entryIndex] = {
      ...vault.entries[entryIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveVault(vault)

    return vault.entries[entryIndex]
  }

  // Delete a password entry
  static async deleteEntry(id: string): Promise<void> {
    const vault = await this.loadVault()

    const entryIndex = vault.entries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      throw new Error("Entry not found")
    }

    vault.entries.splice(entryIndex, 1)
    await this.saveVault(vault)
  }

  // Get all password entries
  static async getAllEntries(): Promise<PasswordEntry[]> {
    const vault = await this.loadVault()
    return vault.entries
  }

  // Search for password entries
  static async searchEntries(query: string): Promise<PasswordEntry[]> {
    const vault = await this.loadVault()

    if (!query) {
      return vault.entries
    }

    const lowerQuery = query.toLowerCase()
    return vault.entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.username.toLowerCase().includes(lowerQuery) ||
        (entry.url && entry.url.toLowerCase().includes(lowerQuery)) ||
        (entry.notes && entry.notes.toLowerCase().includes(lowerQuery)) ||
        (entry.category && entry.category.toLowerCase().includes(lowerQuery)) ||
        (entry.tags && entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))),
    )
  }

  // Add this new method
  static isUnlocked(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(this.SESSION_KEY) !== null;
  }
}

