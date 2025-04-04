import { Encryption } from "./encryption"

// Interface for vault user
export interface VaultUser {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member" | "viewer"
  publicKey?: string
}

// Interface for shared password
export interface SharedPassword {
  id: string
  originalId: string
  title: string
  username: string
  encryptedPassword: string
  url: string
  notes?: string
  sharedBy: string
  sharedWith: string
  createdAt: number
  expiresAt?: number
  permissions: {
    canView: boolean
    canEdit: boolean
    canShare: boolean
    canDelete: boolean
  }
}

// Multi-user vault manager
export class MultiUserVault {
  private static USERS_KEY = "lockeye_vault_users"
  private static SHARED_PASSWORDS_KEY = "lockeye_shared_passwords"

  // Get all vault users
  static getUsers(): VaultUser[] {
    const usersJson = localStorage.getItem(this.USERS_KEY)
    if (!usersJson) {
      return []
    }

    try {
      return JSON.parse(usersJson)
    } catch (error) {
      return []
    }
  }

  // Save vault users
  static saveUsers(users: VaultUser[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
  }

  // Add a new vault user
  static addUser(user: Omit<VaultUser, "id">): VaultUser {
    const users = this.getUsers()

    // Check if email already exists
    if (users.some((u) => u.email === user.email)) {
      throw new Error("A user with this email already exists")
    }

    const newUser: VaultUser = {
      ...user,
      id: crypto.randomUUID(),
    }

    users.push(newUser)
    this.saveUsers(users)

    return newUser
  }

  // Update a vault user
  static updateUser(id: string, updates: Partial<Omit<VaultUser, "id">>): VaultUser {
    const users = this.getUsers()

    const userIndex = users.findIndex((user) => user.id === id)
    if (userIndex === -1) {
      throw new Error("User not found")
    }

    // Check if email is being updated and already exists
    if (updates.email && users.some((u) => u.email === updates.email && u.id !== id)) {
      throw new Error("A user with this email already exists")
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
    }

    this.saveUsers(users)

    return users[userIndex]
  }

  // Delete a vault user
  static deleteUser(id: string): void {
    const users = this.getUsers()

    const userIndex = users.findIndex((user) => user.id === id)
    if (userIndex === -1) {
      throw new Error("User not found")
    }

    users.splice(userIndex, 1)
    this.saveUsers(users)

    // Also delete all shared passwords for this user
    this.deleteSharedPasswordsForUser(id)
  }

  // Get a vault user by ID
  static getUserById(id: string): VaultUser | null {
    const users = this.getUsers()
    return users.find((user) => user.id === id) || null
  }

  // Get a vault user by email
  static getUserByEmail(email: string): VaultUser | null {
    const users = this.getUsers()
    return users.find((user) => user.email === email) || null
  }

  // Get all shared passwords
  static getSharedPasswords(): SharedPassword[] {
    const passwordsJson = localStorage.getItem(this.SHARED_PASSWORDS_KEY)
    if (!passwordsJson) {
      return []
    }

    try {
      return JSON.parse(passwordsJson)
    } catch (error) {
      return []
    }
  }

  // Save shared passwords
  static saveSharedPasswords(passwords: SharedPassword[]): void {
    localStorage.setItem(this.SHARED_PASSWORDS_KEY, JSON.stringify(passwords))
  }

  // Share a password with a user
  static async sharePassword(
    originalId: string,
    title: string,
    username: string,
    password: string,
    url: string,
    notes: string | undefined,
    sharedBy: string,
    sharedWith: string,
    permissions: {
      canView: boolean
      canEdit: boolean
      canShare: boolean
      canDelete: boolean
    },
    expiresAt?: number,
  ): Promise<SharedPassword> {
    const users = this.getUsers()

    // Check if both users exist
    const sharedByUser = users.find((user) => user.id === sharedBy)
    const sharedWithUser = users.find((user) => user.id === sharedWith)

    if (!sharedByUser) {
      throw new Error("Sharing user not found")
    }

    if (!sharedWithUser) {
      throw new Error("Target user not found")
    }

    // Encrypt the password
    // In a real implementation, this would use the recipient's public key
    // For this demo, we'll just use a shared secret
    const encryptedPassword = await Encryption.encrypt(password, `shared_secret_${sharedWith}`)

    const sharedPassword: SharedPassword = {
      id: crypto.randomUUID(),
      originalId,
      title,
      username,
      encryptedPassword,
      url,
      notes,
      sharedBy,
      sharedWith,
      createdAt: Date.now(),
      expiresAt: expiresAt || undefined,
      permissions,
    }

    const sharedPasswords = this.getSharedPasswords()
    sharedPasswords.push(sharedPassword)
    this.saveSharedPasswords(sharedPasswords)

    return sharedPassword
  }

  // Get shared passwords for a user
  static getSharedPasswordsForUser(userId: string): SharedPassword[] {
    const sharedPasswords = this.getSharedPasswords()
    return sharedPasswords.filter((password) => password.sharedWith === userId)
  }

  // Get passwords shared by a user
  static getPasswordsSharedByUser(userId: string): SharedPassword[] {
    const sharedPasswords = this.getSharedPasswords()
    return sharedPasswords.filter((password) => password.sharedBy === userId)
  }

  // Delete a shared password
  static deleteSharedPassword(id: string): void {
    const sharedPasswords = this.getSharedPasswords()

    const passwordIndex = sharedPasswords.findIndex((password) => password.id === id)
    if (passwordIndex === -1) {
      throw new Error("Shared password not found")
    }

    sharedPasswords.splice(passwordIndex, 1)
    this.saveSharedPasswords(sharedPasswords)
  }

  // Delete all shared passwords for a user
  static deleteSharedPasswordsForUser(userId: string): void {
    const sharedPasswords = this.getSharedPasswords()

    const filteredPasswords = sharedPasswords.filter(
      (password) => password.sharedWith !== userId && password.sharedBy !== userId,
    )

    this.saveSharedPasswords(filteredPasswords)
  }

  // Update a shared password
  static updateSharedPassword(
    id: string,
    updates: Partial<Omit<SharedPassword, "id" | "originalId" | "sharedBy" | "sharedWith" | "createdAt">>,
  ): SharedPassword {
    const sharedPasswords = this.getSharedPasswords()

    const passwordIndex = sharedPasswords.findIndex((password) => password.id === id)
    if (passwordIndex === -1) {
      throw new Error("Shared password not found")
    }

    sharedPasswords[passwordIndex] = {
      ...sharedPasswords[passwordIndex],
      ...updates,
    }

    this.saveSharedPasswords(sharedPasswords)

    return sharedPasswords[passwordIndex]
  }
}

