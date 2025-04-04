import { Encryption } from "./encryption"

// Interface for one-time access link
export interface OneTimeAccessLink {
  id: string
  passwordId: string
  encryptedPassword: string
  expiresAt: number
  accessCount: number
  maxAccesses: number
}

// One-time access link manager
export class OneTimeAccess {
  private static LINKS_KEY = "lockeye_one_time_links"

  // Create a one-time access link
  static async createLink(
    passwordId: string,
    password: string,
    expirationMinutes = 60,
    maxAccesses = 1,
  ): Promise<string> {
    // Generate a secure random key for encrypting the password
    const linkKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    // Encrypt the password with the link key
    const encryptedPassword = await Encryption.encrypt(password, linkKey)

    // Create the link object
    const link: OneTimeAccessLink = {
      id: crypto.randomUUID(),
      passwordId,
      encryptedPassword,
      expiresAt: Date.now() + expirationMinutes * 60 * 1000,
      accessCount: 0,
      maxAccesses,
    }

    // Save the link
    const links = this.getLinks()
    links.push(link)
    this.saveLinks(links)

    // Return the access URL (in a real app, this would be a full URL)
    // The link key is included in the URL fragment so it's not sent to the server
    return `${link.id}#${linkKey}`
  }

  // Access a password using a one-time link
  static async accessLink(linkId: string, linkKey: string): Promise<string> {
    const links = this.getLinks()
    const linkIndex = links.findIndex((link) => link.id === linkId)

    if (linkIndex === -1) {
      throw new Error("Link not found")
    }

    const link = links[linkIndex]

    // Check if the link has expired
    if (link.expiresAt < Date.now()) {
      // Remove expired link
      links.splice(linkIndex, 1)
      this.saveLinks(links)
      throw new Error("Link has expired")
    }

    // Check if the link has reached its maximum number of accesses
    if (link.accessCount >= link.maxAccesses) {
      // Remove consumed link
      links.splice(linkIndex, 1)
      this.saveLinks(links)
      throw new Error("Link has been fully consumed")
    }

    try {
      // Decrypt the password
      const password = await Encryption.decrypt(link.encryptedPassword, linkKey)

      // Increment the access count
      link.accessCount++

      // If the link has reached its maximum number of accesses, remove it
      if (link.accessCount >= link.maxAccesses) {
        links.splice(linkIndex, 1)
      } else {
        links[linkIndex] = link
      }

      this.saveLinks(links)

      return password
    } catch (error) {
      throw new Error("Failed to decrypt password")
    }
  }

  // Get all active links
  static getLinks(): OneTimeAccessLink[] {
    const linksJson = localStorage.getItem(this.LINKS_KEY)
    if (!linksJson) {
      return []
    }

    try {
      return JSON.parse(linksJson)
    } catch (error) {
      return []
    }
  }

  // Save links to storage
  private static saveLinks(links: OneTimeAccessLink[]): void {
    localStorage.setItem(this.LINKS_KEY, JSON.stringify(links))
  }

  // Clean up expired links
  static cleanupExpiredLinks(): void {
    const links = this.getLinks()
    const now = Date.now()

    const activeLinks = links.filter((link) => link.expiresAt > now)

    if (activeLinks.length !== links.length) {
      this.saveLinks(activeLinks)
    }
  }

  // Get links for a specific password
  static getLinksForPassword(passwordId: string): OneTimeAccessLink[] {
    return this.getLinks().filter((link) => link.passwordId === passwordId)
  }

  // Revoke a specific link
  static revokeLink(linkId: string): boolean {
    const links = this.getLinks()
    const initialLength = links.length

    const filteredLinks = links.filter((link) => link.id !== linkId)

    if (filteredLinks.length !== initialLength) {
      this.saveLinks(filteredLinks)
      return true
    }

    return false
  }

  // Revoke all links for a password
  static revokeAllLinksForPassword(passwordId: string): number {
    const links = this.getLinks()
    const initialLength = links.length

    const filteredLinks = links.filter((link) => link.passwordId !== passwordId)

    if (filteredLinks.length !== initialLength) {
      this.saveLinks(filteredLinks)
      return initialLength - filteredLinks.length
    }

    return 0
  }
}

