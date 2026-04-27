export const AUTH_STORAGE_KEY = "jobhunter:auth-id"

export function getAuthId(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

export function setAuthId(id: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(AUTH_STORAGE_KEY, id)
}

export function clearAuthId(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
