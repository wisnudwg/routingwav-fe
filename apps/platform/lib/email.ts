/** "budi@example.com" → "b••@example.com" */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@")
  if (!user || !domain) return "•••"
  return `${user.charAt(0)}${"•".repeat(Math.max(user.length - 1, 2))}@${domain}`
}