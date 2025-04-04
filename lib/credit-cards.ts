import { Encryption } from "./encryption"

// Interface for credit card
export interface CreditCard {
  id: string
  name: string
  cardholderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  type?: string // Visa, Mastercard, etc.
  issuer?: string
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  notes?: string
  color?: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

// Credit cards manager
export class CreditCards {
  private static CARDS_KEY = "lockeye_credit_cards"

  // Get all credit cards
  static async getAllCards(masterPassword: string): Promise<CreditCard[]> {
    const encryptedCards = localStorage.getItem(this.CARDS_KEY)
    if (!encryptedCards) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedCards, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt credit cards:", error)
      throw new Error("Failed to decrypt credit cards. Incorrect password or corrupted data.")
    }
  }

  // Save all credit cards
  static async saveAllCards(cards: CreditCard[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(cards), masterPassword)
      localStorage.setItem(this.CARDS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt credit cards:", error)
      throw new Error("Failed to encrypt credit cards")
    }
  }

  // Add a credit card
  static async addCard(
    card: Omit<CreditCard, "id" | "createdAt" | "updatedAt">,
    masterPassword: string,
  ): Promise<CreditCard> {
    const cards = await this.getAllCards(masterPassword)

    const now = Date.now()
    const newCard: CreditCard = {
      ...card,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    // Detect card type based on number
    if (!newCard.type) {
      newCard.type = this.detectCardType(newCard.number)
    }

    cards.push(newCard)
    await this.saveAllCards(cards, masterPassword)

    return newCard
  }

  // Get a credit card by ID
  static async getCardById(id: string, masterPassword: string): Promise<CreditCard | null> {
    const cards = await this.getAllCards(masterPassword)
    return cards.find((card) => card.id === id) || null
  }

  // Update a credit card
  static async updateCard(
    id: string,
    updates: Partial<Omit<CreditCard, "id" | "createdAt" | "updatedAt">>,
    masterPassword: string,
  ): Promise<CreditCard> {
    const cards = await this.getAllCards(masterPassword)

    const cardIndex = cards.findIndex((card) => card.id === id)
    if (cardIndex === -1) {
      throw new Error("Credit card not found")
    }

    // If number is updated, detect card type
    if (updates.number && (!updates.type || updates.type !== cards[cardIndex].type)) {
      updates.type = this.detectCardType(updates.number)
    }

    cards[cardIndex] = {
      ...cards[cardIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveAllCards(cards, masterPassword)

    return cards[cardIndex]
  }

  // Delete a credit card
  static async deleteCard(id: string, masterPassword: string): Promise<void> {
    const cards = await this.getAllCards(masterPassword)

    const cardIndex = cards.findIndex((card) => card.id === id)
    if (cardIndex === -1) {
      throw new Error("Credit card not found")
    }

    cards.splice(cardIndex, 1)
    await this.saveAllCards(cards, masterPassword)
  }

  // Search credit cards
  static async searchCards(
    query: string,
    filters: {
      tags?: string[]
      cardTypes?: string[]
    },
    masterPassword: string,
  ): Promise<CreditCard[]> {
    const cards = await this.getAllCards(masterPassword)

    return cards.filter((card) => {
      // Filter by tag
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some((tag) => card.tags.includes(tag))) {
        return false
      }

      // Filter by card type
      if (filters.cardTypes && filters.cardTypes.length > 0 && card.type && !filters.cardTypes.includes(card.type)) {
        return false
      }

      // Search in name, cardholder name, etc.
      const lowerQuery = query.toLowerCase()

      return (
        card.name.toLowerCase().includes(lowerQuery) ||
        card.cardholderName.toLowerCase().includes(lowerQuery) ||
        card.number.includes(lowerQuery) ||
        (card.issuer && card.issuer.toLowerCase().includes(lowerQuery)) ||
        (card.notes && card.notes.toLowerCase().includes(lowerQuery))
      )
    })
  }

  // Format card number for display (e.g., **** **** **** 1234)
  static formatCardNumber(number: string, showLast4 = true): string {
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

  // Format expiry date (MM/YY)
  static formatExpiryDate(month: string, year: string): string {
    // Ensure month is 2 digits
    const formattedMonth = month.padStart(2, "0")

    // Use last 2 digits of year
    const formattedYear = year.length === 4 ? year.slice(-2) : year

    return `${formattedMonth}/${formattedYear}`
  }

  // Check if a card is expired
  static isCardExpired(month: string, year: string): boolean {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
    const currentYear = now.getFullYear()

    // Convert to numbers
    const expiryMonth = Number.parseInt(month, 10)
    const expiryYear = Number.parseInt(year.length === 2 ? `20${year}` : year, 10)

    return expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)
  }

  // Detect card type based on number
  static detectCardType(number: string): string {
    // Remove spaces and non-numeric characters
    const cleanNumber = number.replace(/\D/g, "")

    // Visa
    if (/^4/.test(cleanNumber)) {
      return "Visa"
    }

    // Mastercard
    if (/^5[1-5]/.test(cleanNumber)) {
      return "Mastercard"
    }

    // American Express
    if (/^3[47]/.test(cleanNumber)) {
      return "American Express"
    }

    // Discover
    if (/^6(?:011|5)/.test(cleanNumber)) {
      return "Discover"
    }

    // JCB
    if (/^35/.test(cleanNumber)) {
      return "JCB"
    }

    // Diners Club
    if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) {
      return "Diners Club"
    }

    return "Unknown"
  }

  // Validate card number using Luhn algorithm
  static validateCardNumber(number: string): boolean {
    // Remove spaces and non-numeric characters
    const cleanNumber = number.replace(/\D/g, "")

    if (!/^\d+$/.test(cleanNumber)) {
      return false
    }

    let sum = 0
    let shouldDouble = false

    // Loop through values starting from the rightmost digit
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(cleanNumber.charAt(i), 10)

      if (shouldDouble) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      shouldDouble = !shouldDouble
    }

    return sum % 10 === 0
  }
}

