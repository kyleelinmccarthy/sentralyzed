import { eq, and, isNull, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { activities, notifications } from '../db/schema/activities.js'
import { users } from '../db/schema/users.js'
import { sendToUser } from '../ws/connections.js'
import { DEFAULT_PAGE_LIMIT } from './utils/db-helpers.js'

type ActivityAction = 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'completed'

export class ActivitiesService {
  async log(data: {
    actorId: string
    action: ActivityAction
    entityType: string
    entityId: string
    metadata?: unknown
    notifyUserIds?: string[]
  }) {
    const [activity] = await db
      .insert(activities)
      .values({
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata,
      })
      .returning()

    // Create notifications for specified users
    const userIds = data.notifyUserIds?.filter((id) => id !== data.actorId) ?? []
    if (userIds.length) {
      const createdNotifications = await db
        .insert(notifications)
        .values(
          userIds.map((userId) => ({
            userId,
            activityId: activity!.id,
          })),
        )
        .returning()

      // Push real-time WebSocket notifications (fire-and-forget)
      for (const notif of createdNotifications) {
        try {
          sendToUser(
            notif.userId,
            JSON.stringify({
              type: 'notification:new',
              payload: {
                notificationId: notif.id,
                activityId: activity!.id,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                metadata: data.metadata ?? {},
                createdAt: notif.createdAt.toISOString(),
              },
              timestamp: new Date().toISOString(),
            }),
          )
        } catch {
          // Silently ignore WS errors — notifications are persisted in DB
        }
      }
    }

    return activity!
  }

  async listActivities(filters?: { entityType?: string; limit?: number }) {
    return db.query.activities.findMany({
      orderBy: [desc(activities.createdAt)],
      limit: filters?.limit || DEFAULT_PAGE_LIMIT,
    })
  }

  async getUserNotifications(userId: string) {
    return db
      .select({
        notification: notifications,
        activity: activities,
        actor: { name: users.name },
      })
      .from(notifications)
      .leftJoin(activities, eq(notifications.activityId, activities.id))
      .leftJoin(users, eq(activities.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(DEFAULT_PAGE_LIMIT)
  }

  async markRead(notificationId: string) {
    const [notification] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning()
    return notification
  }

  async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  }

  async getUnreadCount(userId: string) {
    const result = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    })
    return result.length
  }
}

export const activitiesService = new ActivitiesService()
