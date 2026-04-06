import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    query: {
      files: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
  },
}))

vi.mock('../lib/encryption.js', () => ({
  encrypt: vi.fn((data: Buffer) => ({
    encrypted: Buffer.from('encrypted-' + data.toString()),
    iv: Buffer.from('test-iv-1234567'),
  })),
  decrypt: vi.fn((_encrypted: Buffer, _iv: Buffer) => Buffer.from('decrypted-data')),
}))

const { FilesService, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } =
  await import('../services/files.service.js')

describe('FilesService', () => {
  let service: InstanceType<typeof FilesService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FilesService()
  })

  describe('upload', () => {
    const validMetadata = {
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    }
    const validBuffer = Buffer.from('test-file-data')

    it('uploads a file and returns metadata without encrypted data', async () => {
      const fileRecord = {
        id: 'file-1',
        filename: 'uuid-test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        uploadedBy: 'user-1',
        entityType: 'task',
        entityId: 'task-1',
        createdAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([fileRecord])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.upload(validBuffer, validMetadata, 'user-1', 'task', 'task-1')

      expect(result).toEqual(fileRecord)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('rejects files exceeding max size', async () => {
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE + 1)

      await expect(
        service.upload(
          largeBuffer,
          { ...validMetadata, sizeBytes: MAX_FILE_SIZE + 1 },
          'user-1',
          'task',
          'task-1',
        ),
      ).rejects.toThrow(/exceeds maximum size/)
    })

    it('rejects disallowed MIME types', async () => {
      await expect(
        service.upload(
          validBuffer,
          { ...validMetadata, mimeType: 'application/x-executable' },
          'user-1',
          'task',
          'task-1',
        ),
      ).rejects.toThrow('File type not allowed')
    })

    it('accepts all allowed MIME types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg')
      expect(ALLOWED_MIME_TYPES).toContain('image/png')
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
      expect(ALLOWED_MIME_TYPES).toContain('text/csv')
    })
  })

  describe('download', () => {
    it('returns decrypted file data and metadata', async () => {
      const fileRecord = {
        id: 'file-1',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        encryptedData: Buffer.from('encrypted-data'),
        encryptionIv: Buffer.from('test-iv'),
        deletedAt: null,
      }
      mockFindFirst.mockResolvedValue(fileRecord)

      const result = await service.download('file-1')

      expect(result.metadata.originalName).toBe('test.pdf')
      expect(result.metadata.mimeType).toBe('application/pdf')
      expect(result.data).toBeInstanceOf(Buffer)
    })

    it('throws when file not found', async () => {
      mockFindFirst.mockResolvedValue(undefined)

      await expect(service.download('nonexistent')).rejects.toThrow('File not found')
    })
  })

  describe('listByEntity', () => {
    it('returns files for a given entity without encrypted data', async () => {
      const filesList = [
        {
          id: 'file-1',
          originalName: 'a.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 100,
          entityType: 'task',
          entityId: 'task-1',
          createdAt: new Date(),
        },
        {
          id: 'file-2',
          originalName: 'b.png',
          mimeType: 'image/png',
          sizeBytes: 200,
          entityType: 'task',
          entityId: 'task-1',
          createdAt: new Date(),
        },
      ]
      mockFindMany.mockResolvedValue(filesList)

      const result = await service.listByEntity('task', 'task-1')

      expect(result).toHaveLength(2)
      expect(mockFindMany).toHaveBeenCalled()
    })

    it('returns empty array when no files exist', async () => {
      mockFindMany.mockResolvedValue([])

      const result = await service.listByEntity('task', 'task-999')

      expect(result).toEqual([])
    })
  })

  describe('softDelete', () => {
    it('marks file as deleted', async () => {
      const returning = vi.fn().mockResolvedValue([{ id: 'file-1' }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      await service.softDelete('file-1')

      expect(mockUpdate).toHaveBeenCalled()
    })
  })
})
