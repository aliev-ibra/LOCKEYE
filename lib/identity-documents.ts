import { Encryption } from "./encryption"

// Document types
export type DocumentType =
  | "passport"
  | "id_card"
  | "driver_license"
  | "birth_certificate"
  | "social_security"
  | "residence_permit"
  | "visa"
  | "other"

// Interface for identity document
export interface IdentityDocument {
  id: string
  type: DocumentType
  title: string
  documentNumber: string
  issuedBy: string
  issuedDate: string
  expiryDate: string
  fullName: string
  dateOfBirth?: string
  nationality?: string
  placeOfBirth?: string
  notes?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  imageData?: string // Base64 encoded image
  additionalFields?: {
    [key: string]: string
  }
}

// Identity documents manager
export class IdentityDocuments {
  private static DOCUMENTS_KEY = "lockeye_identity_documents"

  // Get all documents
  static async getAllDocuments(masterPassword: string): Promise<IdentityDocument[]> {
    const encryptedDocuments = localStorage.getItem(this.DOCUMENTS_KEY)
    if (!encryptedDocuments) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedDocuments, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt identity documents:", error)
      throw new Error("Failed to decrypt identity documents. Incorrect password or corrupted data.")
    }
  }

  // Save all documents
  static async saveAllDocuments(documents: IdentityDocument[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(documents), masterPassword)
      localStorage.setItem(this.DOCUMENTS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt identity documents:", error)
      throw new Error("Failed to encrypt identity documents")
    }
  }

  // Add a document
  static async addDocument(
    document: Omit<IdentityDocument, "id" | "createdAt" | "updatedAt">,
    masterPassword: string,
  ): Promise<IdentityDocument> {
    const documents = await this.getAllDocuments(masterPassword)

    const now = Date.now()
    const newDocument: IdentityDocument = {
      ...document,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    documents.push(newDocument)
    await this.saveAllDocuments(documents, masterPassword)

    return newDocument
  }

  // Get a document by ID
  static async getDocumentById(id: string, masterPassword: string): Promise<IdentityDocument | null> {
    const documents = await this.getAllDocuments(masterPassword)
    return documents.find((document) => document.id === id) || null
  }

  // Update a document
  static async updateDocument(
    id: string,
    updates: Partial<Omit<IdentityDocument, "id" | "createdAt" | "updatedAt">>,
    masterPassword: string,
  ): Promise<IdentityDocument> {
    const documents = await this.getAllDocuments(masterPassword)

    const documentIndex = documents.findIndex((document) => document.id === id)
    if (documentIndex === -1) {
      throw new Error("Document not found")
    }

    documents[documentIndex] = {
      ...documents[documentIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveAllDocuments(documents, masterPassword)

    return documents[documentIndex]
  }

  // Delete a document
  static async deleteDocument(id: string, masterPassword: string): Promise<void> {
    const documents = await this.getAllDocuments(masterPassword)

    const documentIndex = documents.findIndex((document) => document.id === id)
    if (documentIndex === -1) {
      throw new Error("Document not found")
    }

    documents.splice(documentIndex, 1)
    await this.saveAllDocuments(documents, masterPassword)
  }

  // Search documents
  static async searchDocuments(
    query: string,
    filters: {
      types?: DocumentType[]
      tags?: string[]
      expiryFrom?: string
      expiryTo?: string
    },
    masterPassword: string,
  ): Promise<IdentityDocument[]> {
    const documents = await this.getAllDocuments(masterPassword)

    return documents.filter((document) => {
      // Filter by type
      if (filters.types && filters.types.length > 0 && !filters.types.includes(document.type)) {
        return false
      }

      // Filter by tag
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some((tag) => document.tags.includes(tag))) {
        return false
      }

      // Filter by expiry date range
      if (filters.expiryFrom && document.expiryDate < filters.expiryFrom) {
        return false
      }

      if (filters.expiryTo && document.expiryDate > filters.expiryTo) {
        return false
      }

      // Search in title, document number, etc.
      const lowerQuery = query.toLowerCase()

      return (
        document.title.toLowerCase().includes(lowerQuery) ||
        document.documentNumber.toLowerCase().includes(lowerQuery) ||
        document.fullName.toLowerCase().includes(lowerQuery) ||
        document.issuedBy.toLowerCase().includes(lowerQuery) ||
        (document.notes && document.notes.toLowerCase().includes(lowerQuery))
      )
    })
  }

  // Check if a document is expired
  static isDocumentExpired(expiryDate: string): boolean {
    const now = new Date()
    const expiry = new Date(expiryDate)
    return expiry < now
  }

  // Check if a document is about to expire (within 90 days)
  static isDocumentExpiringSoon(expiryDate: string): boolean {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    return expiry > now && expiry <= ninetyDaysFromNow
  }

  // Get document type display name
  static getDocumentTypeDisplayName(type: DocumentType): string {
    switch (type) {
      case "passport":
        return "Passport"
      case "id_card":
        return "ID Card"
      case "driver_license":
        return "Driver's License"
      case "birth_certificate":
        return "Birth Certificate"
      case "social_security":
        return "Social Security"
      case "residence_permit":
        return "Residence Permit"
      case "visa":
        return "Visa"
      case "other":
        return "Other Document"
      default:
        return "Unknown Document"
    }
  }
}

