import { Encryption } from "./encryption"

// Interface for vault shard
interface VaultShard {
  id: string
  index: number
  totalShards: number
  data: string
  checksum: string
}

// Vault sharding manager
export class VaultSharding {
  // Split a vault into multiple shards
  static async splitVault(vaultData: string, numShards: number, masterPassword: string): Promise<VaultShard[]> {
    if (numShards < 2) {
      throw new Error("Number of shards must be at least 2")
    }

    // Generate a unique ID for this set of shards
    const shardSetId = crypto.randomUUID()

    // Calculate the size of each shard
    const shardSize = Math.ceil(vaultData.length / numShards)

    // Create shards
    const shards: VaultShard[] = []

    for (let i = 0; i < numShards; i++) {
      // Extract the portion of data for this shard
      const start = i * shardSize
      const end = Math.min(start + shardSize, vaultData.length)
      const shardData = vaultData.substring(start, end)

      // Calculate a checksum for integrity verification
      const checksum = await this.calculateChecksum(shardData)

      // Encrypt the shard data
      const encryptedData = await Encryption.encrypt(shardData, masterPassword)

      // Create the shard
      const shard: VaultShard = {
        id: shardSetId,
        index: i,
        totalShards: numShards,
        data: encryptedData,
        checksum,
      }

      shards.push(shard)
    }

    return shards
  }

  // Combine shards to reconstruct the vault
  static async combineShards(shards: VaultShard[], masterPassword: string): Promise<string> {
    if (!shards.length) {
      throw new Error("No shards provided")
    }

    // Check if all shards belong to the same set
    const shardSetId = shards[0].id
    const totalShards = shards[0].totalShards

    if (!shards.every((shard) => shard.id === shardSetId)) {
      throw new Error("Shards belong to different sets")
    }

    if (shards.length !== totalShards) {
      throw new Error(`Incomplete shards. Expected ${totalShards}, got ${shards.length}`)
    }

    // Sort shards by index
    shards.sort((a, b) => a.index - b.index)

    // Decrypt and verify each shard
    const decryptedShards: string[] = []

    for (const shard of shards) {
      try {
        const decryptedData = await Encryption.decrypt(shard.data, masterPassword)
        decryptedShards.push(decryptedData)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to decrypt shard ${shard.index}: ${errorMessage}`)
      }
    }

    // Combine the decrypted shards
    return decryptedShards.join("")
  }

  // Calculate a checksum for data integrity
  private static async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    // Use SHA-256 for checksum
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)

    // Convert to hex string
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  // Save shards to different storage locations
  static async saveShards(shards: VaultShard[]): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('Cannot save shards: localStorage is not available in server environment');
      return;
    }

    // In a real implementation, you would save shards to different locations
    // For this demo, we'll save them to localStorage with different keys
    for (const shard of shards) {
      const key = `lockeye_shard_${shard.id}_${shard.index}`
      localStorage.setItem(key, JSON.stringify(shard))
    }
  }

  // Load shards from different storage locations
  static async loadShards(shardSetId: string, totalShards: number): Promise<VaultShard[]> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Cannot load shards: localStorage is not available in server environment');
    }

    const shards: VaultShard[] = []

    for (let i = 0; i < totalShards; i++) {
      const key = `lockeye_shard_${shardSetId}_${i}`
      const shardData = localStorage.getItem(key)

      if (!shardData) {
        throw new Error(`Shard ${i} not found`)
      }

      shards.push(JSON.parse(shardData))
    }

    return shards
  }
}

