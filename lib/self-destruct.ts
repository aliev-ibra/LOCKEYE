import { getLocalStorage } from './utils/browser'

export class SelfDestruct {
  private static readonly FAILED_ATTEMPTS_KEY = 'lockeye_failed_attempts'
  private static readonly MAX_ATTEMPTS_KEY = 'lockeye_max_attempts'
  private static readonly DEFAULT_MAX_ATTEMPTS = 5

  static getFailedAttempts(): number {
    const storage = getLocalStorage()
    if (!storage) return 0
    return parseInt(storage.getItem(this.FAILED_ATTEMPTS_KEY) || '0', 10)
  }

  private static setFailedAttempts(attempts: number): void {
    const storage = getLocalStorage()
    if (!storage) return
    storage.setItem(this.FAILED_ATTEMPTS_KEY, attempts.toString())
  }

  static getMaxAttempts(): number {
    const storage = getLocalStorage()
    if (!storage) return this.DEFAULT_MAX_ATTEMPTS
    const maxAttempts = storage.getItem(this.MAX_ATTEMPTS_KEY)
    return maxAttempts ? parseInt(maxAttempts, 10) : this.DEFAULT_MAX_ATTEMPTS
  }

  static setMaxAttempts(maxAttempts: number): void {
    const storage = getLocalStorage()
    if (!storage) return
    storage.setItem(this.MAX_ATTEMPTS_KEY, maxAttempts.toString())
  }

  private static incrementFailedAttempts(): number {
    const attempts = this.getFailedAttempts() + 1
    this.setFailedAttempts(attempts)
    return attempts
  }

  static resetFailedAttempts(): void {
    const storage = getLocalStorage()
    if (!storage) return
    storage.removeItem(this.FAILED_ATTEMPTS_KEY)
  }

  static shouldTriggerSelfDestruct(): boolean {
    return this.getFailedAttempts() >= this.getMaxAttempts()
  }

  static executeSelfDestruct(): void {
    const storage = getLocalStorage()
    if (!storage) return

    // Get all keys that start with 'lockeye_'
    const keys = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith("lockeye_")) {
        keys.push(key)
      }
    }

    // Remove all lockeye data
    keys.forEach((key) => storage.removeItem(key))

    // Reset failed attempts
    this.resetFailedAttempts()
  }

  static recordFailedAttempt(): boolean {
    const attempts = this.incrementFailedAttempts()
    const maxAttempts = this.getMaxAttempts()

    if (attempts >= maxAttempts) {
      this.executeSelfDestruct()
      return true
    }

    return false
  }

  static recordSuccessfulLogin(): void {
    this.resetFailedAttempts()
  }
}

