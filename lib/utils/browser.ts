export function getLocalStorage() {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null; // Return null if not in a browser environment
}