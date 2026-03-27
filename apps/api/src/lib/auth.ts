import argon2 from 'argon2'
import { randomBytes, createHash } from 'node:crypto'

export async function hash(password: string): Promise<string> {
  return argon2.hash(password)
}

export async function verify(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
