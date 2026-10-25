// No look-alike characters (0/O, 1/l/I)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

export function generateTempPassword(): string {
  const limit = 256 - (256 % CHARS.length) // rejection sampling: no modulo bias
  const out: string[] = []
  while (out.length < 12) {
    for (const b of crypto.getRandomValues(new Uint8Array(24))) {
      if (b < limit && out.length < 12) out.push(CHARS.charAt(b % CHARS.length))
    }
  }
  return [out.slice(0, 4), out.slice(4, 8), out.slice(8, 12)].map((g) => g.join("")).join("-")
}