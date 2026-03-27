import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import { sessions } from '../db/schema/sessions.js'
import { invitations } from '../db/schema/invitations.js'
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
