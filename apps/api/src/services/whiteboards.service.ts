import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { whiteboards } from '../db/schema/whiteboards.js'
import { whereActiveById, softDelete } from './utils/db-helpers.js'

export class WhiteboardsService {
  async list(userId: string) {
    return db.query.whiteboards.findMany({
      where: and(eq(whiteboards.createdBy, userId), isNull(whiteboards.deletedAt)),
      orderBy: (w, { desc }) => [desc(w.updatedAt)],
      columns: {
        id: true,
        name: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    })
  }

  async getById(id: string) {
    return db.query.whiteboards.findFirst({
      where: whereActiveById(whiteboards.id, id, whiteboards.deletedAt),
    })
  }

  async create(data: { name: string; createdBy: string; projectId?: string }) {
    const [whiteboard] = await db
      .insert(whiteboards)
      .values({
        name: data.name,
        createdBy: data.createdBy,
        projectId: data.projectId,
        shapesData: [],
      })
      .returning()
    return whiteboard!
  }

  async update(id: string, data: Partial<{ name: string; shapesData: unknown[] }>) {
    const [whiteboard] = await db
      .update(whiteboards)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(whiteboards.id, id), isNull(whiteboards.deletedAt)))
      .returning()
    return whiteboard
  }

  async softDelete(id: string) {
    return softDelete(whiteboards, whiteboards.id, id)
  }
}

export const whiteboardsService = new WhiteboardsService()
