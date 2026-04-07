import { eq, and, ne } from 'drizzle-orm'
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
import { hash, verify, generateToken, hashToken } from '../lib/auth.js'

const SESSION_EXPIRY_DAYS = 7

export class AuthService {
  async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user || !user.passwordHash) {
      return null
    }

    if (!user.isActive) {
      return null
    }

    const valid = await verify(user.passwordHash, password)
    if (!valid) {
      return null
    }

    const session = await this.createSession(user.id)
    return { user, session }
  }

  async register(email: string, name: string, password: string, inviteToken: string) {
    const tokenHash = hashToken(inviteToken)
    const invitation = await db.query.invitations.findFirst({
      where: and(eq(invitations.tokenHash, tokenHash), eq(invitations.email, email)),
    })

    if (!invitation) {
      throw new Error('Invalid invitation token')
    }

    if (invitation.acceptedAt) {
      throw new Error('Invitation already used')
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation expired')
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (existingUser) {
      throw new Error('Email already registered')
    }

    const passwordHash = await hash(password)

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        authProvider: 'email',
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      })
      .returning()

    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id))

    const session = await this.createSession(user!.id)
    return { user: user!, session }
  }

  async googleAuth(_googleId: string, email: string, name: string, avatarUrl: string | null) {
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (user) {
      // Update existing user with Google info
      const [updated] = await db
        .update(users)
        .set({ avatarUrl, authProvider: 'google' })
        .where(eq(users.id, user.id))
        .returning()
      user = updated!
    } else {
      // Check if there's a pending invitation for this email
      const invitation = await db.query.invitations.findFirst({
        where: and(eq(invitations.email, email)),
      })

      if (!invitation) {
        throw new Error('No invitation found for this email')
      }

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name,
          avatarUrl,
          authProvider: 'google',
          role: invitation.role,
          invitedBy: invitation.invitedBy,
        })
        .returning()

      await db
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id))

      user = newUser!
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    const session = await this.createSession(user.id)
    return { user, session }
  }

  async createSession(userId: string) {
    const token = generateToken()
    const tokenHashVal = hashToken(token)
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        tokenHash: tokenHashVal,
        expiresAt,
      })
      .returning()

    return { ...session!, token }
  }

  async validateSession(token: string) {
    const tokenHashVal = hashToken(token)
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.tokenHash, tokenHashVal)),
    })

    if (!session) {
      return null
    }

    if (session.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, session.id))
      return null
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    })

    if (!user || !user.isActive) {
      return null
    }

    // Sliding window: extend session if more than half expired
    const halfLife = (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000) / 2
    if (session.expiresAt.getTime() - Date.now() < halfLife) {
      const newExpiry = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      await db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, session.id))
    }

    return { user, session }
  }

  async logout(token: string) {
    const tokenHashVal = hashToken(token)
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHashVal))
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user || !user.passwordHash) {
      throw new Error('Cannot change password for this account')
    }

    const valid = await verify(user.passwordHash, currentPassword)
    if (!valid) {
      throw new Error('Current password is incorrect')
    }

    const newHash = await hash(newPassword)
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId))
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string | null }) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, userId)).returning()
    return updated!
  }

  async getSessions(userId: string, currentTokenHash: string) {
    const allSessions = await db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: (s, { desc: d }) => [d(s.createdAt)],
    })

    return allSessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.tokenHash === currentTokenHash,
    }))
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId)),
    })
    if (!session) {
      throw new Error('Session not found')
    }
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  async revokeOtherSessions(userId: string, currentTokenHash: string) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, currentTokenHash)))
  }

  async exportUserData(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: false },
    })

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

  async deleteAccount(userId: string, password: string | null) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify password for email users
    if (user.authProvider === 'email' && user.passwordHash) {
      if (!password) {
        throw new Error('Password is required to delete your account')
      }
      const valid = await verify(user.passwordHash, password)
      if (!valid) {
        throw new Error('Incorrect password')
      }
    }

    // Deactivate and anonymize the user rather than hard delete
    // This preserves referential integrity while removing personal data
    await db
      .update(users)
      .set({
        isActive: false,
        name: 'Deleted User',
        email: `deleted-${userId}@removed.local`,
        avatarUrl: null,
        passwordHash: null,
      })
      .where(eq(users.id, userId))

    // Delete all sessions
    await db.delete(sessions).where(eq(sessions.userId, userId))
  }

  async createInvitation(email: string, role: 'admin' | 'manager' | 'member', invitedBy: string) {
    const token = generateToken()
    const tokenHashVal = hashToken(token)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

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
}

export const authService = new AuthService()
