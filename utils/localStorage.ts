/**
 * Safe localStorage wrapper that works in both browser and server environments
 */

/**
 * Gets an item from localStorage with type safety
 * @param key The key to retrieve from localStorage
 * @param defaultValue Default value to return if key doesn't exist
 * @returns The stored value or defaultValue
 */
export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    // Try to parse as JSON, fall back to raw value if parsing fails
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.error(`Error getting localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Sets an item in localStorage with automatic JSON stringification
 * @param key The key to set in localStorage
 * @param value The value to store
 */
export const setLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, valueToStore);
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

/**
 * Removes an item from localStorage
 * @param key The key to remove from localStorage
 */
export const removeLocalStorage = (key: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

/**
 * Clears all items from localStorage
 */
export const clearLocalStorage = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};