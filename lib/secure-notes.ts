import { Encryption } from "./encryption"

// Note types
export type NoteType =
  | "text"
  | "markdown"
  | "voice"
  | "drawing"
  | "document"
  | "contact"
  | "card"
  | "medical"
  | "journal"

// Note visibility
export type NoteVisibility = "normal" | "hidden" | "decoy"

// Note security level
export type SecurityLevel = "standard" | "high" | "biometric" | "time-locked"

// Interface for note tag
export interface NoteTag {
  id: string
  name: string
  color: string
}

// Interface for note
export interface SecureNote {
  id: string
  title: string
  content: string
  type: NoteType
  visibility: NoteVisibility
  securityLevel: SecurityLevel
  tags: string[] // Tag IDs
  createdAt: number
  updatedAt: number
  accessedAt: number
  expiresAt?: number // For auto-destruct notes
  readCount?: number // For auto-destruct notes
  maxReads?: number // For auto-destruct notes
  unlockTime?: number // For time-locked notes
  attachments?: string[] // Attachment IDs
  metadata?: {
    wordCount?: number
    readTime?: number
    originalFormat?: string
    [key: string]: any
  }
}

// Interface for attachment
export interface NoteAttachment {
  id: string
  noteId: string
  name: string
  type: string
  size: number
  encryptedData: string
  thumbnail?: string
  createdAt: number
}

// Secure notes manager
export class SecureNotes {
  private static NOTES_KEY = "lockeye_secure_notes"
  private static TAGS_KEY = "lockeye_note_tags"
  private static ATTACHMENTS_KEY = "lockeye_note_attachments"

  // Get all notes
  static async getAllNotes(masterPassword: string): Promise<SecureNote[]> {
    const encryptedNotes = localStorage.getItem(this.NOTES_KEY)
    if (!encryptedNotes) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedNotes, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt notes:", error)
      throw new Error("Failed to decrypt notes. Incorrect password or corrupted data.")
    }
  }

  // Save all notes
  static async saveAllNotes(notes: SecureNote[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(notes), masterPassword)
      localStorage.setItem(this.NOTES_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt notes:", error)
      throw new Error("Failed to encrypt notes")
    }
  }

  // Add a note
  static async addNote(
    note: Omit<SecureNote, "id" | "createdAt" | "updatedAt" | "accessedAt" | "readCount">,
    masterPassword: string,
  ): Promise<SecureNote> {
    const notes = await this.getAllNotes(masterPassword)

    const now = Date.now()
    const newNote: SecureNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      accessedAt: now,
      readCount: 0,
    }

    notes.push(newNote)
    await this.saveAllNotes(notes, masterPassword)

    return newNote
  }

  // Get a note by ID
  static async getNoteById(id: string, masterPassword: string): Promise<SecureNote | null> {
    const notes = await this.getAllNotes(masterPassword)
    const note = notes.find((note) => note.id === id)

    if (!note) {
      return null
    }

    // Update access time and read count
    note.accessedAt = Date.now()
    if (note.readCount !== undefined) {
      note.readCount++
    }

    // Check if note should self-destruct
    if (note.maxReads && note.readCount && note.readCount >= note.maxReads) {
      // Delete the note
      await this.deleteNote(id, masterPassword)
      return null
    }

    // Check if note has expired
    if (note.expiresAt && note.expiresAt < Date.now()) {
      // Delete the note
      await this.deleteNote(id, masterPassword)
      return null
    }

    // Check if note is time-locked
    if (note.unlockTime && note.unlockTime > Date.now()) {
      throw new Error(`This note is time-locked until ${new Date(note.unlockTime).toLocaleString()}`)
    }

    // Save the updated access time and read count
    await this.saveAllNotes(notes, masterPassword)

    return note
  }

  // Update a note
  static async updateNote(
    id: string,
    updates: Partial<Omit<SecureNote, "id" | "createdAt" | "updatedAt">>,
    masterPassword: string,
  ): Promise<SecureNote> {
    const notes = await this.getAllNotes(masterPassword)

    const noteIndex = notes.findIndex((note) => note.id === id)
    if (noteIndex === -1) {
      throw new Error("Note not found")
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    await this.saveAllNotes(notes, masterPassword)

    return notes[noteIndex]
  }

  // Delete a note
  static async deleteNote(id: string, masterPassword: string): Promise<void> {
    const notes = await this.getAllNotes(masterPassword)

    const noteIndex = notes.findIndex((note) => note.id === id)
    if (noteIndex === -1) {
      throw new Error("Note not found")
    }

    // Remove the note
    notes.splice(noteIndex, 1)

    // Delete any attachments for this note
    await this.deleteAttachmentsForNote(id, masterPassword)

    await this.saveAllNotes(notes, masterPassword)
  }

  // Search notes
  static async searchNotes(
    query: string,
    filters: {
      types?: NoteType[]
      tags?: string[]
      dateFrom?: number
      dateTo?: number
      securityLevels?: SecurityLevel[]
    },
    masterPassword: string,
  ): Promise<SecureNote[]> {
    const notes = await this.getAllNotes(masterPassword)

    return notes.filter((note) => {
      // Skip decoy notes in search results unless explicitly searching for them
      if (note.visibility === "decoy" && !filters.types?.includes("decoy" as any)) {
        return false
      }

      // Filter by type
      if (filters.types && filters.types.length > 0 && !filters.types.includes(note.type)) {
        return false
      }

      // Filter by tag
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some((tag) => note.tags.includes(tag))) {
        return false
      }

      // Filter by date range
      if (filters.dateFrom && note.createdAt < filters.dateFrom) {
        return false
      }

      if (filters.dateTo && note.createdAt > filters.dateTo) {
        return false
      }

      // Filter by security level
      if (
        filters.securityLevels &&
        filters.securityLevels.length > 0 &&
        !filters.securityLevels.includes(note.securityLevel)
      ) {
        return false
      }

      // Search in title and content
      const lowerQuery = query.toLowerCase()
      return note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery)
    })
  }

  // Get all tags
  static async getAllTags(masterPassword: string): Promise<NoteTag[]> {
    const encryptedTags = localStorage.getItem(this.TAGS_KEY)
    if (!encryptedTags) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedTags, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt tags:", error)
      throw new Error("Failed to decrypt tags. Incorrect password or corrupted data.")
    }
  }

  // Save all tags
  static async saveAllTags(tags: NoteTag[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(tags), masterPassword)
      localStorage.setItem(this.TAGS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt tags:", error)
      throw new Error("Failed to encrypt tags")
    }
  }

  // Add a tag
  static async addTag(name: string, color: string, masterPassword: string): Promise<NoteTag> {
    const tags = await this.getAllTags(masterPassword)

    // Check if tag with this name already exists
    if (tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Tag "${name}" already exists`)
    }

    const newTag: NoteTag = {
      id: crypto.randomUUID(),
      name,
      color,
    }

    tags.push(newTag)
    await this.saveAllTags(tags, masterPassword)

    return newTag
  }

  // Update a tag
  static async updateTag(id: string, updates: Partial<Omit<NoteTag, "id">>, masterPassword: string): Promise<NoteTag> {
    const tags = await this.getAllTags(masterPassword)

    const tagIndex = tags.findIndex((tag) => tag.id === id)
    if (tagIndex === -1) {
      throw new Error("Tag not found")
    }

    // Check if new name conflicts with existing tag
    if (updates.name && tags.some((tag) => tag.id !== id && tag.name.toLowerCase() === updates.name!.toLowerCase())) {
      throw new Error(`Tag "${updates.name}" already exists`)
    }

    tags[tagIndex] = {
      ...tags[tagIndex],
      ...updates,
    }

    await this.saveAllTags(tags, masterPassword)

    return tags[tagIndex]
  }

  // Delete a tag
  static async deleteTag(id: string, masterPassword: string): Promise<void> {
    const tags = await this.getAllTags(masterPassword)

    const tagIndex = tags.findIndex((tag) => tag.id === id)
    if (tagIndex === -1) {
      throw new Error("Tag not found")
    }

    // Remove the tag
    tags.splice(tagIndex, 1)

    // Also remove this tag from all notes
    const notes = await this.getAllNotes(masterPassword)
    let notesUpdated = false

    for (const note of notes) {
      const tagIndex = note.tags.indexOf(id)
      if (tagIndex !== -1) {
        note.tags.splice(tagIndex, 1)
        notesUpdated = true
      }
    }

    // Save changes
    await this.saveAllTags(tags, masterPassword)
    if (notesUpdated) {
      await this.saveAllNotes(notes, masterPassword)
    }
  }

  // Get all attachments
  static async getAllAttachments(masterPassword: string): Promise<NoteAttachment[]> {
    const encryptedAttachments = localStorage.getItem(this.ATTACHMENTS_KEY)
    if (!encryptedAttachments) {
      return []
    }

    try {
      const decryptedData = await Encryption.decrypt(encryptedAttachments, masterPassword)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to decrypt attachments:", error)
      throw new Error("Failed to decrypt attachments. Incorrect password or corrupted data.")
    }
  }

  // Save all attachments
  static async saveAllAttachments(attachments: NoteAttachment[], masterPassword: string): Promise<void> {
    try {
      const encryptedData = await Encryption.encrypt(JSON.stringify(attachments), masterPassword)
      localStorage.setItem(this.ATTACHMENTS_KEY, encryptedData)
    } catch (error) {
      console.error("Failed to encrypt attachments:", error)
      throw new Error("Failed to encrypt attachments")
    }
  }

  // Add an attachment
  static async addAttachment(noteId: string, file: File, masterPassword: string): Promise<NoteAttachment> {
    // Read the file as a data URL
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Encrypt the file data
    const encryptedData = await Encryption.encrypt(fileData, masterPassword)

    // Generate a thumbnail for images
    let thumbnail: string | undefined
    if (file.type.startsWith("image/")) {
      thumbnail = await this.generateThumbnail(fileData)
    }

    const attachments = await this.getAllAttachments(masterPassword)

    const newAttachment: NoteAttachment = {
      id: crypto.randomUUID(),
      noteId,
      name: file.name,
      type: file.type,
      size: file.size,
      encryptedData,
      thumbnail,
      createdAt: Date.now(),
    }

    attachments.push(newAttachment)
    await this.saveAllAttachments(attachments, masterPassword)

    return newAttachment
  }

  // Get attachments for a note
  static async getAttachmentsForNote(noteId: string, masterPassword: string): Promise<NoteAttachment[]> {
    const attachments = await this.getAllAttachments(masterPassword)
    return attachments.filter((attachment) => attachment.noteId === noteId)
  }

  // Get an attachment by ID
  static async getAttachmentById(id: string, masterPassword: string): Promise<NoteAttachment | null> {
    const attachments = await this.getAllAttachments(masterPassword)
    return attachments.find((attachment) => attachment.id === id) || null
  }

  // Delete an attachment
  static async deleteAttachment(id: string, masterPassword: string): Promise<void> {
    const attachments = await this.getAllAttachments(masterPassword)

    const attachmentIndex = attachments.findIndex((attachment) => attachment.id === id)
    if (attachmentIndex === -1) {
      throw new Error("Attachment not found")
    }

    // Remove the attachment
    attachments.splice(attachmentIndex, 1)

    await this.saveAllAttachments(attachments, masterPassword)
  }

  // Delete all attachments for a note
  static async deleteAttachmentsForNote(noteId: string, masterPassword: string): Promise<void> {
    const attachments = await this.getAllAttachments(masterPassword)

    const remainingAttachments = attachments.filter((attachment) => attachment.noteId !== noteId)

    if (remainingAttachments.length !== attachments.length) {
      await this.saveAllAttachments(remainingAttachments, masterPassword)
    }
  }

  // Decrypt an attachment
  static async decryptAttachment(attachment: NoteAttachment, masterPassword: string): Promise<string> {
    try {
      return await Encryption.decrypt(attachment.encryptedData, masterPassword)
    } catch (error) {
      console.error("Failed to decrypt attachment:", error)
      throw new Error("Failed to decrypt attachment. Incorrect password or corrupted data.")
    }
  }

  // Generate a thumbnail for an image
  private static async generateThumbnail(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_WIDTH = 100
        const MAX_HEIGHT = 100
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = dataUrl
    })
  }

  // Create a steganographic image containing a note
  static async hideNoteInImage(note: SecureNote, imageFile: File, password: string): Promise<string> {
    // This is a simplified implementation of steganography
    // In a real implementation, you would use a proper steganography library

    // Read the image file
    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })

    // Encrypt the note data
    const noteData = JSON.stringify(note)
    const encryptedNoteData = await Encryption.encrypt(noteData, password)

    // Encode the encrypted note data in the image
    // This is a placeholder - in a real implementation, you would use a proper steganography algorithm
    const stegoImage = `${imageData}#${encryptedNoteData}`

    return stegoImage
  }

  // Extract a note from a steganographic image
  static async extractNoteFromImage(stegoImage: string, password: string): Promise<SecureNote> {
    // This is a simplified implementation of steganography
    // In a real implementation, you would use a proper steganography library

    // Extract the encrypted note data from the image
    const parts = stegoImage.split("#")
    if (parts.length !== 2) {
      throw new Error("Invalid steganographic image")
    }

    const encryptedNoteData = parts[1]

    // Decrypt the note data
    try {
      const noteData = await Encryption.decrypt(encryptedNoteData, password)
      return JSON.parse(noteData)
    } catch (error) {
      console.error("Failed to decrypt note from image:", error)
      throw new Error("Failed to extract note from image. Incorrect password or corrupted data.")
    }
  }

  // Securely delete a file (simulate secure deletion)
  static async securelyDeleteFile(fileData: string): Promise<void> {
    // In a real implementation, you would overwrite the file with random data multiple times
    // before deleting it to prevent forensic recovery
    // Since we're in a web context, we'll just simulate this process

    // Generate random data of the same size as the file
    const randomData = new Uint8Array(fileData.length)
    crypto.getRandomValues(randomData)

    // In a real implementation, you would overwrite the file with this random data
    // multiple times before deleting it

    // For this demo, we'll just return a promise that resolves after a short delay
    return new Promise((resolve) => setTimeout(resolve, 500))
  }
}

