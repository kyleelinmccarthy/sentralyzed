import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from './env.js'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex')
}

export function encrypt(data: Buffer): { encrypted: Buffer; iv: Buffer } {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Append auth tag to encrypted data
  return {
    encrypted: Buffer.concat([encrypted, authTag]),
    iv,
  }
}

export function decrypt(encryptedData: Buffer, iv: Buffer): Buffer {
  // Last 16 bytes are the auth tag
  const authTag = encryptedData.subarray(encryptedData.length - 16)
  const encrypted = encryptedData.subarray(0, encryptedData.length - 16)

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
