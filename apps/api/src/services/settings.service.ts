import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { userSettings, mutedEntities } from '../db/schema/settings.js'
import { users } from '../db/schema/users.js'
import { channels } from '../db/schema/chat.js'
import { projects } from '../db/schema/projects.js'
import type { UpdateSettingsInput, MuteEntityInput } from '@sentral/shared/validators/settings'
import type { UserSettings, MutedEntity } from '@sentral/shared/types/settings'

export class SettingsService {
  async getByUserId(userId: string): Promise<UserSettings> {
    let settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    })

    if (!settings) {
      const [created] = await db
        .insert(userSettings)
        .values({ userId })
        .onConflictDoNothing()
        .returning()

      settings =
        created ??
        (await db.query.userSettings.findFirst({
          where: eq(userSettings.userId, userId),
        }))!
    }

    const muted = await db
      .select({ entityType: mutedEntities.entityType, entityId: mutedEntities.entityId })
      .from(mutedEntities)
      .where(eq(mutedEntities.userId, userId))

    const mutedChannelIds = muted.filter((m) => m.entityType === 'channel').map((m) => m.entityId)
    const mutedProjectIds = muted.filter((m) => m.entityType === 'project').map((m) => m.entityId)

    const mutedChannels = await this.resolveNames('channel', mutedChannelIds)
    const mutedProjects = await this.resolveNames('project', mutedProjectIds)

    return {
      id: settings.id,
      notifyTaskAssignment: settings.notifyTaskAssignment,
      notifyChatMention: settings.notifyChatMention,
      notifyForumReply: settings.notifyForumReply,
      notifyProjectUpdate: settings.notifyProjectUpdate,
      notifyEventInvite: settings.notifyEventInvite,
      notifyGoalUpdate: settings.notifyGoalUpdate,
      emailDigest: settings.emailDigest,
      dashboardWidgets: settings.dashboardWidgets,
      timezone: settings.timezone,
      workingHoursStart: settings.workingHoursStart,
      workingHoursEnd: settings.workingHoursEnd,
      defaultCalendarView: settings.defaultCalendarView,
      mutedChannels,
      mutedProjects,
    }
  }

  async update(userId: string, data: UpdateSettingsInput): Promise<UserSettings> {
    await db
      .insert(userSettings)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...data, updatedAt: new Date() },
      })

    return this.getByUserId(userId)
  }

  async muteEntity(userId: string, input: MuteEntityInput): Promise<void> {
    await db
      .insert(mutedEntities)
      .values({ userId, entityType: input.entityType, entityId: input.entityId })
      .onConflictDoNothing()
  }

  async unmuteEntity(userId: string, input: MuteEntityInput): Promise<void> {
    await db
      .delete(mutedEntities)
      .where(
        and(
          eq(mutedEntities.userId, userId),
          eq(mutedEntities.entityType, input.entityType),
          eq(mutedEntities.entityId, input.entityId),
        ),
      )
  }

  async getTeamSchedule(): Promise<
    Array<{
      userId: string
      name: string
      avatarUrl: string | null
      timezone: string
      workingHoursStart: string
      workingHoursEnd: string
    }>
  > {
    const rows = await db
      .select({
        userId: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        timezone: userSettings.timezone,
        workingHoursStart: userSettings.workingHoursStart,
        workingHoursEnd: userSettings.workingHoursEnd,
      })
      .from(users)
      .innerJoin(userSettings, eq(users.id, userSettings.userId))
      .where(eq(users.isActive, true))

    return rows
  }

  private async resolveNames(type: 'channel' | 'project', ids: string[]): Promise<MutedEntity[]> {
    if (ids.length === 0) return []

    if (type === 'channel') {
      const rows = await db
        .select({ id: channels.id, name: channels.name })
        .from(channels)
        .where(inArray(channels.id, ids))
      return rows.map((r) => ({ entityId: r.id, name: r.name }))
    }

    const rows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(inArray(projects.id, ids))
    return rows.map((r) => ({ entityId: r.id, name: r.name }))
  }
}

export const settingsService = new SettingsService()
