import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { feedback, feedbackResponses } from '../db/schema/feedback.js'
import type {
  CreateFeedbackInput,
  UpdateFeedbackStatusInput,
  FeedbackQueryInput,
} from '@sentralyzed/shared/validators/feedback'

type Role = 'admin' | 'manager' | 'member'

export class FeedbackService {
  async create(input: CreateFeedbackInput, userId: string) {
    const [item] = await db
      .insert(feedback)
      .values({
        ...input,
        submittedBy: userId,
        status: 'open',
      })
      .returning()
    return item!
  }

  async getById(id: string, userId: string, role: Role) {
    const item = await db.query.feedback.findFirst({
      where: and(eq(feedback.id, id), isNull(feedback.deletedAt)),
    })
    if (!item) return null
    if (role === 'member' && item.submittedBy !== userId) return null
    return item
  }

  async list(query: FeedbackQueryInput, userId: string, role: Role) {
    const conditions = [isNull(feedback.deletedAt)]

    if (role === 'member') {
      conditions.push(eq(feedback.submittedBy, userId))
    } else if (query.submittedBy) {
      conditions.push(eq(feedback.submittedBy, query.submittedBy))
    }

    if (query.status) conditions.push(eq(feedback.status, query.status))
    if (query.category) conditions.push(eq(feedback.category, query.category))
    if (query.priority) conditions.push(eq(feedback.priority, query.priority))

    return db.query.feedback.findMany({
      where: and(...conditions),
      orderBy: (f, { desc }) => [desc(f.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    })
  }

  async updateStatus(id: string, input: UpdateFeedbackStatusInput, reviewerId: string) {
    const item = await db.query.feedback.findFirst({
      where: and(eq(feedback.id, id), isNull(feedback.deletedAt)),
    })
    if (!item) return { error: 'Feedback not found' }

    const [updated] = await db
      .update(feedback)
      .set({
        status: input.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        adminNotes: input.adminNotes ?? null,
      })
      .where(eq(feedback.id, id))
      .returning()
    return updated!
  }

  async addResponse(feedbackId: string, message: string, userId: string) {
    const item = await db.query.feedback.findFirst({
      where: and(eq(feedback.id, feedbackId), isNull(feedback.deletedAt)),
    })
    if (!item) return { error: 'Feedback not found' }

    const [response] = await db
      .insert(feedbackResponses)
      .values({
        feedbackId,
        respondedBy: userId,
        message,
      })
      .returning()
    return response!
  }

  async getWithResponses(id: string, userId: string, role: Role) {
    const item = await this.getById(id, userId, role)
    if (!item) return null

    const responses = await db.query.feedbackResponses.findMany({
      where: eq(feedbackResponses.feedbackId, id),
    })

    return { ...item, responses }
  }

  async softDelete(id: string, userId: string, role: Role): Promise<boolean> {
    const item = await db.query.feedback.findFirst({
      where: and(eq(feedback.id, id), isNull(feedback.deletedAt)),
    })
    if (!item) return false
    if (role === 'member' && item.submittedBy !== userId) return false

    await db.update(feedback).set({ deletedAt: new Date() }).where(eq(feedback.id, id)).returning()
    return true
  }
}

export const feedbackService = new FeedbackService()
