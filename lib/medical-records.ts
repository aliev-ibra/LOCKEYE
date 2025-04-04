import { Encryption } from "./encryption"

// Interface for medical record
export interface MedicalRecord {
  id: string
  type: "condition" | "medication" | "allergy" | "immunization" | "procedure" | "test" | "note" | "document"
  title: string
  description: string
  date: string // ISO date string
  provider?: string
  location?: string
  status?: string
  notes?: string
  attachments?: string[] // Attachment IDs
  tags: string[]
  createdAt: number
  updatedAt: number
  metadata?: {
    dosage?: string
    frequency?: string
    duration?: string
    severity?: string
    results?: string
    [key: string]: any
  }
}

// Medical records manager
export class MedicalRecords {
  private static RECORDS_KEY = "lockeye_medical_records"

  // Get all medical records
  static async getAllRecords(masterPassword: string): Promise<MedicalRecord[]> {
    const encryptedRecords = localStorage.getItem(this.RECORDS_KEY)
    if (!encryptedRecords) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedRecords, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt medical records:", error)
      throw new Error("Failed to decrypt medical records. Incorrect password or corrupted data.")
    }
  }

  // Save all medical records
  static async saveAllRecords(records: MedicalRecord[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(records), masterPassword)
      localStorage.setItem(this.RECORDS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt medical records:", error)
      throw new Error("Failed to encrypt medical records")
    }
  }

  // Add a medical record
  static async addRecord(
    record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">,
    masterPassword: string,
  ): Promise<MedicalRecord> {
    const records = await this.getAllRecords(masterPassword)

    const now = Date.now()
    const newRecord: MedicalRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    records.push(newRecord)
    await this.saveAllRecords(records, masterPassword)

    return newRecord
  }

  // Get a medical record by ID
  static async getRecordById(id: string, masterPassword: string): Promise<MedicalRecord | null> {
    const records = await this.getAllRecords(masterPassword)
    return records.find((record) => record.id === id) || null
  }

  // Update a medical record
  static async updateRecord(
    id: string,
    updates: Partial<Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">>,
    masterPassword: string,
  ): Promise<MedicalRecord> {
    const records = await this.getAllRecords(masterPassword)

    const recordIndex = records.findIndex((record) => record.id === id)
    if (recordIndex === -1) {
      throw new Error("Medical record not found")
    }

    records[recordIndex] = {
      ...records[recordIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveAllRecords(records, masterPassword)

    return records[recordIndex]
  }

  // Delete a medical record
  static async deleteRecord(id: string, masterPassword: string): Promise<void> {
    const records = await this.getAllRecords(masterPassword)

    const recordIndex = records.findIndex((record) => record.id === id)
    if (recordIndex === -1) {
      throw new Error("Medical record not found")
    }

    records.splice(recordIndex, 1)
    await this.saveAllRecords(records, masterPassword)
  }

  // Search medical records
  static async searchRecords(
    query: string,
    filters: {
      types?: string[]
      tags?: string[]
      dateFrom?: string
      dateTo?: string
    },
    masterPassword: string,
  ): Promise<MedicalRecord[]> {
    const records = await this.getAllRecords(masterPassword)

    return records.filter((record) => {
      // Filter by type
      if (filters.types && filters.types.length > 0 && !filters.types.includes(record.type)) {
        return false
      }

      // Filter by tag
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some((tag) => record.tags.includes(tag))) {
        return false
      }

      // Filter by date range
      if (filters.dateFrom && record.date < filters.dateFrom) {
        return false
      }

      if (filters.dateTo && record.date > filters.dateTo) {
        return false
      }

      // Search in title, description, etc.
      const lowerQuery = query.toLowerCase()

      return (
        record.title.toLowerCase().includes(lowerQuery) ||
        record.description.toLowerCase().includes(lowerQuery) ||
        (record.provider && record.provider.toLowerCase().includes(lowerQuery)) ||
        (record.location && record.location.toLowerCase().includes(lowerQuery)) ||
        (record.notes && record.notes.toLowerCase().includes(lowerQuery))
      )
    })
  }

  // Export medical records as PDF
  static async exportAsPDF(records: MedicalRecord[]): Promise<Blob> {
    // In a real implementation, you would use a PDF generation library
    // For this demo, we'll just create a simple text representation

    let content = "MEDICAL RECORDS EXPORT\n\n"

    for (const record of records) {
      content += `TYPE: ${record.type.toUpperCase()}\n`
      content += `TITLE: ${record.title}\n`
      content += `DATE: ${record.date}\n`
      content += `DESCRIPTION: ${record.description}\n`

      if (record.provider) {
        content += `PROVIDER: ${record.provider}\n`
      }

      if (record.location) {
        content += `LOCATION: ${record.location}\n`
      }

      if (record.status) {
        content += `STATUS: ${record.status}\n`
      }

      if (record.notes) {
        content += `NOTES: ${record.notes}\n`
      }

      if (record.metadata) {
        content += "ADDITIONAL INFORMATION:\n"
        for (const [key, value] of Object.entries(record.metadata)) {
          if (value) {
            content += `  ${key.toUpperCase()}: ${value}\n`
          }
        }
      }

      content += "\n---\n\n"
    }

    // Create a blob with the content
    return new Blob([content], { type: "application/pdf" })
  }

  // Get records by type
  static async getRecordsByType(type: string, masterPassword: string): Promise<MedicalRecord[]> {
    const records = await this.getAllRecords(masterPassword)
    return records.filter((record) => record.type === type)
  }

  // Get active medications
  static async getActiveMedications(masterPassword: string): Promise<MedicalRecord[]> {
    const records = await this.getAllRecords(masterPassword)
    return records.filter(
      (record) => record.type === "medication" && record.status !== "discontinued" && record.status !== "completed",
    )
  }

  // Get active conditions
  static async getActiveConditions(masterPassword: string): Promise<MedicalRecord[]> {
    const records = await this.getAllRecords(masterPassword)
    return records.filter((record) => record.type === "condition" && record.status !== "resolved")
  }
}

