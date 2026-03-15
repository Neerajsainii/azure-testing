export type LoginIntent = "student" | "administration" | "main"

export type AdministrationRole = "principal" | "hod" | "placement_officer"

export const ADMINISTRATION_ROLE_STORAGE_KEY = "ston_administration_selected_role"

function matchesRoutePrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function resolveLoginPath(pathname: string): string {
  const path = String(pathname || "").toLowerCase()

  if (path === "/main" || matchesRoutePrefix(path, "/admin-dashboard") || matchesRoutePrefix(path, "/admin")) {
    return "/main"
  }

  if (
    matchesRoutePrefix(path, "/principal-dashboard") ||
    matchesRoutePrefix(path, "/principal") ||
    matchesRoutePrefix(path, "/hod-dashboard") ||
    matchesRoutePrefix(path, "/hod") ||
    matchesRoutePrefix(path, "/placement-dashboard") ||
    matchesRoutePrefix(path, "/placement")
  ) {
    return "/administration"
  }

  return "/login"
}

export function normalizeAdministrationRole(role: unknown): AdministrationRole | null {
  const value = String(role || "").trim().toLowerCase()
  if (value === "principal") return "principal"
  if (value === "hod") return "hod"
  if (value === "placement_officer" || value === "placement") return "placement_officer"
  return null
}
