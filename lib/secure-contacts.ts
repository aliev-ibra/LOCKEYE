import { Encryption } from "./encryption"

// Interface for secure contact
export interface SecureContact {
  id: string
  firstName: string
  lastName: string
  company?: string
  emails: {
    type: string
    email: string
    isPrimary: boolean
  }[]
  phones: {
    type: string
    number: string
    isPrimary: boolean
  }[]
  addresses: {
    type: string
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    isPrimary: boolean
  }[]
  websites: string[]
  notes?: string
  birthday?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  photoData?: string
}

// Secure contacts manager
export class SecureContacts {
  private static CONTACTS_KEY = "lockeye_secure_contacts"

  // Get all contacts
  static async getAllContacts(masterPassword: string): Promise<SecureContact[]> {
    const encryptedContacts = localStorage.getItem(this.CONTACTS_KEY)
    if (!encryptedContacts) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedContacts, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt contacts:", error)
      throw new Error("Failed to decrypt contacts. Incorrect password or corrupted data.")
    }
  }

  // Save all contacts
  static async saveAllContacts(contacts: SecureContact[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(contacts), masterPassword)
      localStorage.setItem(this.CONTACTS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt contacts:", error)
      throw new Error("Failed to encrypt contacts")
    }
  }

  // Add a contact
  static async addContact(
    contact: Omit<SecureContact, "id" | "createdAt" | "updatedAt">,
    masterPassword: string,
  ): Promise<SecureContact> {
    const contacts = await this.getAllContacts(masterPassword)

    const now = Date.now()
    const newContact: SecureContact = {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    contacts.push(newContact)
    await this.saveAllContacts(contacts, masterPassword)

    return newContact
  }

  // Get a contact by ID
  static async getContactById(id: string, masterPassword: string): Promise<SecureContact | null> {
    const contacts = await this.getAllContacts(masterPassword)
    return contacts.find((contact) => contact.id === id) || null
  }

  // Update a contact
  static async updateContact(
    id: string,
    updates: Partial<Omit<SecureContact, "id" | "createdAt" | "updatedAt">>,
    masterPassword: string,
  ): Promise<SecureContact> {
    const contacts = await this.getAllContacts(masterPassword)

    const contactIndex = contacts.findIndex((contact) => contact.id === id)
    if (contactIndex === -1) {
      throw new Error("Contact not found")
    }

    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveAllContacts(contacts, masterPassword)

    return contacts[contactIndex]
  }

  // Delete a contact
  static async deleteContact(id: string, masterPassword: string): Promise<void> {
    const contacts = await this.getAllContacts(masterPassword)

    const contactIndex = contacts.findIndex((contact) => contact.id === id)
    if (contactIndex === -1) {
      throw new Error("Contact not found")
    }

    contacts.splice(contactIndex, 1)
    await this.saveAllContacts(contacts, masterPassword)
  }

  // Search contacts
  static async searchContacts(
    query: string,
    filters: {
      tags?: string[]
    },
    masterPassword: string,
  ): Promise<SecureContact[]> {
    const contacts = await this.getAllContacts(masterPassword)

    return contacts.filter((contact) => {
      // Filter by tag
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some((tag) => contact.tags.includes(tag))) {
        return false
      }

      // Search in name, email, phone, etc.
      const lowerQuery = query.toLowerCase()

      // Check name
      if (
        contact.firstName.toLowerCase().includes(lowerQuery) ||
        contact.lastName.toLowerCase().includes(lowerQuery) ||
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(lowerQuery)
      ) {
        return true
      }

      // Check company
      if (contact.company && contact.company.toLowerCase().includes(lowerQuery)) {
        return true
      }

      // Check emails
      if (contact.emails.some((email) => email.email.toLowerCase().includes(lowerQuery))) {
        return true
      }

      // Check phones
      if (contact.phones.some((phone) => phone.number.includes(lowerQuery))) {
        return true
      }

      // Check addresses
      if (
        contact.addresses.some(
          (address) =>
            address.street.toLowerCase().includes(lowerQuery) ||
            address.city.toLowerCase().includes(lowerQuery) ||
            address.state.toLowerCase().includes(lowerQuery) ||
            address.postalCode.includes(lowerQuery) ||
            address.country.toLowerCase().includes(lowerQuery),
        )
      ) {
        return true
      }

      // Check notes
      if (contact.notes && contact.notes.toLowerCase().includes(lowerQuery)) {
        return true
      }

      return false
    })
  }

  // Export contacts as vCard
  static async exportAsVCard(contacts: SecureContact[]): Promise<string> {
    let vCardData = ""

    for (const contact of contacts) {
      vCardData += "BEGIN:VCARD\n"
      vCardData += "VERSION:3.0\n"

      // Name
      vCardData += `N:${contact.lastName};${contact.firstName};;;\n`
      vCardData += `FN:${contact.firstName} ${contact.lastName}\n`

      // Company
      if (contact.company) {
        vCardData += `ORG:${contact.company}\n`
      }

      // Emails
      for (const email of contact.emails) {
        vCardData += `EMAIL;TYPE=${email.type}:${email.email}\n`
      }

      // Phones
      for (const phone of contact.phones) {
        vCardData += `TEL;TYPE=${phone.type}:${phone.number}\n`
      }

      // Addresses
      for (const address of contact.addresses) {
        vCardData += `ADR;TYPE=${address.type}:;;${address.street};${address.city};${address.state};${address.postalCode};${address.country}\n`
      }

      // Websites
      for (const website of contact.websites) {
        vCardData += `URL:${website}\n`
      }

      // Birthday
      if (contact.birthday) {
        vCardData += `BDAY:${contact.birthday}\n`
      }

      // Notes
      if (contact.notes) {
        vCardData += `NOTE:${contact.notes}\n`
      }

      // Photo
      if (contact.photoData) {
        // Remove data URL prefix
        const photoBase64 = contact.photoData.split(",")[1]
        vCardData += `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}\n`
      }

      vCardData += "END:VCARD\n\n"
    }

    return vCardData
  }

  // Import contacts from vCard
  static async importFromVCard(vCardData: string, masterPassword: string): Promise<SecureContact[]> {
    const vCards = vCardData.split("BEGIN:VCARD").filter((card) => card.trim().length > 0)
    const importedContacts: SecureContact[] = []

    for (const vCard of vCards) {
      try {
        const lines = vCard.split("\n").filter((line) => line.trim().length > 0)

        // Basic contact structure
        const contact: Partial<SecureContact> = {
          id: crypto.randomUUID(),
          firstName: "",
          lastName: "",
          emails: [],
          phones: [],
          addresses: [],
          websites: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        // Parse vCard lines
        for (const line of lines) {
          const [key, value] = line.split(":", 2)

          if (!key || !value) continue

          const keyParts = key.split(";")
          const baseKey = keyParts[0]

          switch (baseKey) {
            case "N":
              const nameParts = value.split(";")
              contact.lastName = nameParts[0] || ""
              contact.firstName = nameParts[1] || ""
              break

            case "ORG":
              contact.company = value
              break

            case "EMAIL":
              const emailType = keyParts.length > 1 ? keyParts[1].replace("TYPE=", "") : "other"
              contact.emails = [
                ...(contact.emails || []),
                {
                  type: emailType,
                  email: value,
                  isPrimary: false,
                },
              ]
              break

            case "TEL":
              const phoneType = keyParts.length > 1 ? keyParts[1].replace("TYPE=", "") : "other"
              contact.phones = [
                ...(contact.phones || []),
                {
                  type: phoneType,
                  number: value,
                  isPrimary: false,
                },
              ]
              break

            case "ADR":
              const addressType = keyParts.length > 1 ? keyParts[1].replace("TYPE=", "") : "other"
              const addressParts = value.split(";")
              contact.addresses = [
                ...(contact.addresses || []),
                {
                  type: addressType,
                  street: addressParts[2] || "",
                  city: addressParts[3] || "",
                  state: addressParts[4] || "",
                  postalCode: addressParts[5] || "",
                  country: addressParts[6] || "",
                  isPrimary: false,
                },
              ]
              break

            case "URL":
              contact.websites = [...(contact.websites || []), value]
              break

            case "BDAY":
              contact.birthday = value
              break

            case "NOTE":
              contact.notes = value
              break

            case "PHOTO":
              // Handle photo data
              if (keyParts.includes("ENCODING=b") || keyParts.includes("ENCODING=BASE64")) {
                const photoType = keyParts.find((part) => part.startsWith("TYPE="))?.replace("TYPE=", "") || "JPEG"
                contact.photoData = `data:image/${photoType.toLowerCase()};base64,${value}`
              }
              break
          }
        }

        // Ensure required fields are present
        if (contact.firstName || contact.lastName) {
          importedContacts.push(contact as SecureContact)
        }
      } catch (error) {
        console.error("Failed to parse vCard:", error)
        // Continue with next vCard
      }
    }

    // Save imported contacts
    if (importedContacts.length > 0) {
      const existingContacts = await this.getAllContacts(masterPassword)
      await this.saveAllContacts([...existingContacts, ...importedContacts], masterPassword)
    }

    return importedContacts
  }
}

