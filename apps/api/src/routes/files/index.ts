import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.js'
import { filesService } from '../../services/files.service.js'
import type { AppEnv } from '../../types.js'

const filesRouter = new Hono<AppEnv>()

filesRouter.use('*', authMiddleware)

// Upload file
filesRouter.post('/upload', async (c) => {
  const user = c.get('user')
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const entityType = formData.get('entityType') as string
  const entityId = formData.get('entityId') as string

  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (!entityType || !entityId) return c.json({ error: 'entityType and entityId required' }, 400)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await filesService.upload(
      buffer,
      {
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      user.id,
      entityType,
      entityId,
    )
    return c.json({ file: result }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return c.json({ error: message }, 400)
  }
})

// Download file
filesRouter.get('/:id', async (c) => {
  try {
    const { data, metadata } = await filesService.download(c.req.param('id'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Buffer is valid BodyInit at runtime
    return new Response(data as any, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
        'Content-Length': String(metadata.sizeBytes),
      },
    })
  } catch {
    return c.json({ error: 'File not found' }, 404)
  }
})

// List files for an entity
filesRouter.get('/', async (c) => {
  const entityType = c.req.query('entityType')
  const entityId = c.req.query('entityId')
  if (!entityType || !entityId) return c.json({ error: 'entityType and entityId required' }, 400)

  const filesList = await filesService.listByEntity(entityType, entityId)
  return c.json({ files: filesList })
})

// Delete file
filesRouter.delete('/:id', async (c) => {
  await filesService.softDelete(c.req.param('id'))
  return c.json({ ok: true })
})

export { filesRouter }
