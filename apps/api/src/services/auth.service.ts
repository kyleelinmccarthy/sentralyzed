import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import { sessions } from '../db/schema/sessions.js'
import { invitations } from '../db/schema/invitations.js'
import { activities } from '../db/schema/activities.js'
import { projects } from '../db/schema/projects.js'
import { tasks } from '../db/schema/tasks.js'
import { goals } from '../db/schema/goals.js'
import { messages } from '../db/schema/chat.js'
import { forumThreads, forumReplies } from '../db/schema/forums.js'
import { events } from '../db/schema/calendar.js'
import { generateToken, hashToken } from '../lib/auth.js'

const INVITATION_EXPIRY_DAYS = 7

export class AuthService {
  async createInvitation(email: string, role: 'admin' | 'manager' | 'member', invitedBy: string) {
    const token = generateToken()
    const tokenHashVal = hashToken(token)
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const [invitation] = await db
      .insert(invitations)
      .values({
        email,
        role,
        invitedBy,
        tokenHash: tokenHashVal,
        expiresAt,
      })
      .returning()

    return { ...invitation!, token }
  }

  async exportUserData(userId: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

    const [
      userProjects,
      userTasks,
      userGoals,
      userActivities,
      userMessages,
      userThreads,
      userReplies,
      userEvents,
    ] = await Promise.all([
      db.query.projects.findMany({ where: eq(projects.ownerId, userId) }),
      db.query.tasks.findMany({ where: eq(tasks.reporterId, userId) }),
      db.query.goals.findMany({ where: eq(goals.ownerId, userId) }),
      db.query.activities.findMany({
        where: eq(activities.actorId, userId),
        orderBy: (a, { desc: d }) => [d(a.createdAt)],
        limit: 1000,
      }),
      db.query.messages.findMany({ where: eq(messages.authorId, userId) }),
      db.query.forumThreads.findMany({ where: eq(forumThreads.authorId, userId) }),
      db.query.forumReplies.findMany({ where: eq(forumReplies.authorId, userId) }),
      db.query.events.findMany({ where: eq(events.createdBy, userId) }),
    ])

    return {
      account: user,
      projects: userProjects,
      tasks: userTasks,
      goals: userGoals,
      activities: userActivities,
      messages: userMessages,
      forumThreads: userThreads,
      forumReplies: userReplies,
      calendarEvents: userEvents,
      exportedAt: new Date().toISOString(),
    }
  }

  // Soft-delete: anonymize PII, deactivate, drop sessions. The Better Auth
  // session/account cascade-delete via the user_id FK once the user row is
  // removed; here we keep the row to preserve referential integrity for the
  // 26 FKs from other tables (tasks, projects, etc.).
  async deleteAccount(userId: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) {
      throw new Error('User not found')
    }

    await db
      .update(users)
      .set({
        isActive: false,
        name: 'Deleted User',
        email: `deleted-${userId}@removed.local`,
        avatarUrl: null,
      })
      .where(eq(users.id, userId))

    await db.delete(sessions).where(eq(sessions.userId, userId))
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string | null }) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, userId)).returning()
    return updated!
  }
}

export const authService = new AuthService()
