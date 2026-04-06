import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { files } from '../db/schema/files.js'
import { encrypt, decrypt } from '../lib/encryption.js'
import { randomUUID } from 'node:crypto'
import { whereActiveById } from './utils/db-helpers.js'

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/gzip',
]

export interface FileMetadata {
  originalName: string
  mimeType: string
  sizeBytes: number
}

function validateFile(data: Buffer, metadata: FileMetadata) {
  if (data.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
  if (!ALLOWED_MIME_TYPES.includes(metadata.mimeType)) {
    throw new Error('File type not allowed')
  }
}

export class FilesService {
  async upload(
    data: Buffer,
    metadata: FileMetadata,
    uploadedBy: string,
    entityType: string,
    entityId: string,
  ) {
    validateFile(data, metadata)

    const { encrypted, iv } = encrypt(data)
    const filename = `${randomUUID()}-${metadata.originalName}`

    const [file] = await db
      .insert(files)
      .values({
        filename,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        sizeBytes: metadata.sizeBytes,
        encryptedData: encrypted,
        encryptionIv: iv,
        uploadedBy,
        entityType,
        entityId,
      })
      .returning({
        id: files.id,
        filename: files.filename,
        originalName: files.originalName,
        mimeType: files.mimeType,
        sizeBytes: files.sizeBytes,
        uploadedBy: files.uploadedBy,
        entityType: files.entityType,
        entityId: files.entityId,
        createdAt: files.createdAt,
      })

    return file!
  }

  async download(fileId: string) {
    const file = await db.query.files.findFirst({
      where: whereActiveById(files.id, fileId, files.deletedAt),
    })

    if (!file) throw new Error('File not found')

    const decrypted = decrypt(file.encryptedData, file.encryptionIv)

    return {
      data: decrypted,
      metadata: {
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      },
    }
  }

  async listByEntity(entityType: string, entityId: string) {
    return db.query.files.findMany({
      where: and(
        eq(files.entityType, entityType),
        eq(files.entityId, entityId),
        isNull(files.deletedAt),
      ),
      columns: {
        encryptedData: false,
        encryptionIv: false,
      },
    })
  }

  async softDelete(fileId: string) {
    await db.update(files).set({ deletedAt: new Date() }).where(eq(files.id, fileId))
  }
}

export const filesService = new FilesService()
