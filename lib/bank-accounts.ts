import { Encryption } from "./encryption"

// Account types
export type AccountType = "checking" | "savings" | "credit" | "investment" | "retirement" | "business" | "other"

// Interface for bank account
export interface BankAccount {
  id: string
  type: AccountType
  title: string
  bankName: string
  accountNumber: string
  routingNumber?: string
  iban?: string
  swift?: string
  accountHolder: string
  currency: string
  balance?: string
  openDate?: string
  notes?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  additionalFields?: {
    [key: string]: string
  }
}

// Bank accounts manager
export class BankAccounts {
  private static ACCOUNTS_KEY = "lockeye_bank_accounts"

  // Get all accounts
  static async getAllAccounts(masterPassword: string): Promise<BankAccount[]> {
    const encryptedAccounts = localStorage.getItem(this.ACCOUNTS_KEY)
    if (!encryptedAccounts) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedAccounts, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt bank accounts:", error)
      throw new Error("Failed to decrypt bank accounts. Incorrect password or corrupted data.")
    }
  }

  // Save all accounts
  static async saveAllAccounts(accounts: BankAccount[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(accounts), masterPassword)
      localStorage.setItem(this.ACCOUNTS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt bank accounts:", error)
      throw new Error("Failed to encrypt bank accounts")
    }
  }

  // Add an account
  static async addAccount(
    account: Omit<BankAccount, "id" | "createdAt" | "updatedAt">,
    masterPassword: string,
  ): Promise<BankAccount> {
    const accounts = await this.getAllAccounts(masterPassword)

    const now = Date.now()
    const newAccount: BankAccount = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    accounts.push(newAccount)
    await this.saveAllAccounts(accounts, masterPassword)

    return newAccount
  }

  // Get an account by ID
  static async getAccountById(id: string, masterPassword: string): Promise<BankAccount | null> {
    const accounts = await this.getAllAccounts(masterPassword)
    return accounts.find((account) => account.id === id) || null
  }

  // Update an account
  static async updateAccount(
    id: string,
    updates: Partial<Omit<BankAccount, "id" | "createdAt" | "updatedAt">>,
    masterPassword: string,
  ): Promise<BankAccount> {
    const accounts = await this.getAllAccounts(masterPassword)

    const accountIndex = accounts.findIndex((account) => account.id === id)
    if (accountIndex === -1) {
      throw new Error("Account not found")
    }

    accounts[accountIndex] = {
      ...accounts[accountIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveAllAccounts(accounts, masterPassword)

    return accounts[accountIndex]
  }

  // Delete an account
  static async deleteAccount(id: string, masterPassword: string): Promise<void> {
    const accounts = await this.getAllAccounts(masterPassword)

    const accountIndex = accounts.findIndex((account) => account.id === id)
    if (accountIndex === -1) {
      throw new Error("Account not found")
    }

    accounts.splice(accountIndex, 1)
    await this.saveAllAccounts(accounts, masterPassword)
  }

  // Search accounts
  static async searchAccounts(
    query: string,
    filters: {
      types?: AccountType[]
      tags?: string[]
    },
    masterPassword: string,
  ): Promise<BankAccount[]> {
    const accounts = await this.getAllAccounts(masterPassword)

    return accounts.filter((account) => {
      // Filter by type
      if (filters.types && filters.types.length > 0 && !filters.types.includes(account.type)) {
        return false
      }

      // Filter by tag
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some((tag) => account.tags.includes(tag))) {
        return false
      }

      // Search in title, bank name, account number, etc.
      const lowerQuery = query.toLowerCase()

      return (
        account.title.toLowerCase().includes(lowerQuery) ||
        account.bankName.toLowerCase().includes(lowerQuery) ||
        account.accountNumber.includes(lowerQuery) ||
        account.accountHolder.toLowerCase().includes(lowerQuery) ||
        (account.iban && account.iban.includes(lowerQuery)) ||
        (account.swift && account.swift.includes(lowerQuery)) ||
        (account.notes && account.notes.toLowerCase().includes(lowerQuery))
      )
    })
  }

  // Format account number for display (e.g., **** **** **** 1234)
  static formatAccountNumber(number: string, showLast4 = true): string {
    // Remove spaces and non-numeric characters
    const cleanNumber = number.replace(/\D/g, "")

    if (showLast4) {
      // Show only last 4 digits
      return "*".repeat(cleanNumber.length - 4) + cleanNumber.slice(-4)
    } else {
      // Hide all digits
      return "*".repeat(cleanNumber.length)
    }
  }

  // Get account type display name
  static getAccountTypeDisplayName(type: AccountType): string {
    switch (type) {
      case "checking":
        return "Checking Account"
      case "savings":
        return "Savings Account"
      case "credit":
        return "Credit Account"
      case "investment":
        return "Investment Account"
      case "retirement":
        return "Retirement Account"
      case "business":
        return "Business Account"
      case "other":
        return "Other Account"
      default:
        return "Unknown Account"
    }
  }
}

