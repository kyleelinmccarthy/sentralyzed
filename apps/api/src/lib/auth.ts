import { randomBytes, createHash } from 'node:crypto'

// Invitation tokens still live in our DB (Better Auth doesn't manage these).
// We generate a random token, store its SHA-256 hash, and the user presents the
// raw token via the /register?token=... URL.
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
