export const ALIAS_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
export const ALIAS_REGEX_I = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/i

// UX-level only. The server must enforce its own reserved list and uniqueness.
export const RESERVED_ALIASES = new Set([
  "admin", "root", "iam", "api", "www", "app", "auth", "support", "help", "routing",
  "routingwav", "billing", "legal", "security", "system", "dashboard", "login", "signin",
  "signup", "register", "status", "mail", "docs",
])

export const isAliasWellFormed = (a: string) => ALIAS_REGEX.test(a) && !RESERVED_ALIASES.has(a)

/** Live-typing cleanup: lowercase, spaces → hyphens, strip anything else */
export function sanitizeAlias(input: string) {
  return input.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 63)
}

/** Suggestion from a display name: also strips accents and edge hyphens */
export function slugifyAlias(input: string) {
  return sanitizeAlias(input.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""))
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}