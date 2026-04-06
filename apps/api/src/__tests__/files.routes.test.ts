import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockUser = { id: 'user-1', role: 'member' }
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('user', { ...mockUser })
    await next()
  }),
}))

const mockUpload = vi.fn()
const mockDownload = vi.fn()
const mockListByEntity = vi.fn()
const mockSoftDelete = vi.fn()

vi.mock('../services/files.service.js', () => ({
  filesService: {
    upload: mockUpload,
    download: mockDownload,
    listByEntity: mockListByEntity,
    softDelete: mockSoftDelete,
  },
}))

const { filesRouter } = await import('../routes/files/index.js')

const app = new Hono()
app.route('/files', filesRouter)

describe('Files Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.id = 'user-1'
  })

  describe('POST /files/upload', () => {
    it('uploads a file and returns 201', async () => {
      const fileRecord = {
        id: 'file-1',
        filename: 'uuid-test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        entityType: 'task',
        entityId: 'task-1',
        uploadedBy: 'user-1',
        createdAt: new Date().toISOString(),
      }
      mockUpload.mockResolvedValue(fileRecord)

      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf')
      formData.append('entityType', 'task')
      formData.append('entityId', 'task-1')

      const res = await app.request('/files/upload', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.file).toEqual(fileRecord)
      expect(mockUpload).toHaveBeenCalled()
    })

    it('returns 400 when no file provided', async () => {
      const formData = new FormData()
      formData.append('entityType', 'task')
      formData.append('entityId', 'task-1')

      const res = await app.request('/files/upload', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('No file provided')
    })

    it('returns 400 when entityType/entityId missing', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.pdf')

      const res = await app.request('/files/upload', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('entityType and entityId required')
    })

    it('returns 400 when service throws validation error', async () => {
      mockUpload.mockRejectedValue(new Error('File type not allowed'))

      const formData = new FormData()
      formData.append('file', new Blob(['test'], { type: 'application/x-executable' }), 'bad.exe')
      formData.append('entityType', 'task')
      formData.append('entityId', 'task-1')

      const res = await app.request('/files/upload', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('File type not allowed')
    })
  })

  describe('GET /files/:id', () => {
    it('returns file data with correct headers', async () => {
      mockDownload.mockResolvedValue({
        data: Buffer.from('file content'),
        metadata: { originalName: 'test.pdf', mimeType: 'application/pdf', sizeBytes: 12 },
      })

      const res = await app.request('/files/file-1')

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/pdf')
      expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="test.pdf"')
    })

    it('returns 404 when file not found', async () => {
      mockDownload.mockRejectedValue(new Error('File not found'))

      const res = await app.request('/files/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('GET /files', () => {
    it('returns files for an entity', async () => {
      const filesList = [
        { id: 'file-1', originalName: 'a.pdf' },
        { id: 'file-2', originalName: 'b.png' },
      ]
      mockListByEntity.mockResolvedValue(filesList)

      const res = await app.request('/files?entityType=task&entityId=task-1')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.files).toEqual(filesList)
    })

    it('returns 400 when query params missing', async () => {
      const res = await app.request('/files')

      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('entityType and entityId required')
    })
  })

  describe('DELETE /files/:id', () => {
    it('soft deletes a file', async () => {
      mockSoftDelete.mockResolvedValue(undefined)

      const res = await app.request('/files/file-1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      expect((await res.json()).ok).toBe(true)
      expect(mockSoftDelete).toHaveBeenCalledWith('file-1')
    })
  })
})
