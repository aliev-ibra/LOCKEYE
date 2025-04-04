import { Buffer } from "buffer"

// AES-256 Encryption implementation
export class Encryption {
  // Generate a key from the master password and salt
  static async deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(masterPassword)

    // Import the password as a key
    const passwordKey = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveKey"])

    // Derive a key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000, // High iteration count for security
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    )
  }

  // Encrypt data using AES-256-GCM
  static async encrypt(data: string, masterPassword: string): Promise<string> {
    try {
      // Generate a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16))

      // Generate a random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // Derive the key from the master password
      const key = await this.deriveKey(masterPassword, salt)

      // Encode the data
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        dataBuffer,
      )

      // Combine salt, IV, and encrypted data
      const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength)
      result.set(salt, 0)
      result.set(iv, salt.length)
      result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length)

      // Convert to base64 for storage
      return Buffer.from(result).toString("base64")
    } catch (error) {
      console.error("Encryption error:", error)
      throw new Error("Failed to encrypt data")
    }
  }

  // Decrypt data using AES-256-GCM
  static async decrypt(encryptedData: string, masterPassword: string): Promise<string> {
    try {
      // Convert from base64
      const encryptedBuffer = Buffer.from(encryptedData, "base64")

      // Extract salt, IV, and encrypted data
      const salt = encryptedBuffer.slice(0, 16)
      const iv = encryptedBuffer.slice(16, 28)
      const data = encryptedBuffer.slice(28)

      // Derive the key from the master password
      const key = await this.deriveKey(masterPassword, salt)

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        data,
      )

      // Decode the data
      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      console.error("Decryption error:", error)
      throw new Error("Failed to decrypt data. Incorrect password or corrupted data.")
    }
  }

  // Generate a random password
  static generatePassword(
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  ): string {
    let charset = ""
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-="

    if (charset === "") {
      throw new Error("At least one character type must be selected")
    }

    // Generate cryptographically secure random values
    const randomValues = new Uint32Array(length)
    crypto.getRandomValues(randomValues)

    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length]
    }

    return password
  }

  // Generate a memorable passphrase
  static generatePassphrase(wordCount = 4): string {
    // Common words for passphrases (this is a small sample, a real implementation would use a larger wordlist)
    const words = [
      "apple",
      "banana",
      "orange",
      "grape",
      "kiwi",
      "mango",
      "lemon",
      "peach",
      "house",
      "table",
      "chair",
      "window",
      "door",
      "floor",
      "ceiling",
      "wall",
      "river",
      "mountain",
      "ocean",
      "forest",
      "desert",
      "valley",
      "hill",
      "lake",
      "happy",
      "brave",
      "calm",
      "eager",
      "gentle",
      "honest",
      "kind",
      "loyal",
      "swift",
      "bright",
      "dark",
      "loud",
      "quiet",
      "soft",
      "strong",
      "warm",
    ]

    // Generate cryptographically secure random values
    const randomValues = new Uint32Array(wordCount)
    crypto.getRandomValues(randomValues)

    // Select random words
    const selectedWords = Array.from(randomValues).map((val) => words[val % words.length])

    // Add a random number at the end
    const randomNumber = Math.floor(Math.random() * 1000)

    return `${selectedWords.join("-")}-${randomNumber}`
  }

  // Calculate password strength (0-100)
  static calculatePasswordStrength(password: string): number {
    if (!password) return 0

    let score = 0

    // Length contribution (up to 40 points)
    score += Math.min(password.length * 2, 40)

    // Character variety contribution (up to 60 points)
    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumbers = /[0-9]/.test(password)
    const hasSymbols = /[^a-zA-Z0-9]/.test(password)

    if (hasLowercase) score += 10
    if (hasUppercase) score += 15
    if (hasNumbers) score += 15
    if (hasSymbols) score += 20

    return Math.min(score, 100)
  }

  // Get strength label based on score
  static getStrengthLabel(score: number): "weak" | "medium" | "strong" {
    if (score < 40) return "weak"
    if (score < 70) return "medium"
    return "strong"
  }
}

