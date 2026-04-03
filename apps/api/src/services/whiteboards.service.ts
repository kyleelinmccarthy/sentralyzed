import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { whiteboards } from '../db/schema/whiteboards.js'

export class WhiteboardsService {
  async list() {
    return db.query.whiteboards.findMany({
      where: and(isNull(whiteboards.deletedAt)),
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
      where: and(eq(whiteboards.id, id), isNull(whiteboards.deletedAt)),
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
    const [whiteboard] = await db
      .update(whiteboards)
      .set({ deletedAt: new Date() })
      .where(eq(whiteboards.id, id))
      .returning()
    return whiteboard
  }
}

export const whiteboardsService = new WhiteboardsService()
