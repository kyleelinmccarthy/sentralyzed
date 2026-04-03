import { eq, and, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { polls, pollOptions, pollVotes } from '../db/schema/polls.js'
import type { CreatePollInput } from '@sentralyzed/shared/validators/poll'

export class PollsService {
  async create(input: CreatePollInput, userId: string) {
    const [poll] = await db
      .insert(polls)
      .values({
        question: input.question,
        contextType: input.contextType,
        contextId: input.contextId,
        createdBy: userId,
        allowMultiple: input.allowMultiple,
        isAnonymous: input.isAnonymous,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      })
      .returning()

    const optionValues = input.options.map((text, index) => ({
      pollId: poll!.id,
      text,
      position: index,
    }))
    const options = await db.insert(pollOptions).values(optionValues).returning()

    return { ...poll!, options, totalVotes: 0, userVotes: [] }
  }

  async getAll(userId: string) {
    const allPolls = await db.query.polls.findMany({
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit: 50,
    })
    return Promise.all(allPolls.map((poll) => this.enrichPoll(poll, userId)))
  }

  async getByContext(
    contextType: 'channel' | 'forum' | 'project' | 'goal',
    contextId: string,
    userId: string,
  ) {
    const contextPolls = await db.query.polls.findMany({
      where: and(eq(polls.contextType, contextType), eq(polls.contextId, contextId)),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    })

    return Promise.all(contextPolls.map((poll) => this.enrichPoll(poll, userId)))
  }

  async getById(pollId: string, userId: string) {
    const poll = await db.query.polls.findFirst({ where: eq(polls.id, pollId) })
    if (!poll) return null
    return this.enrichPoll(poll, userId)
  }

  async vote(pollId: string, optionIds: string[], userId: string) {
    const poll = await db.query.polls.findFirst({ where: eq(polls.id, pollId) })
    if (!poll) return { error: 'Poll not found' }

    if (poll.closedAt) return { error: 'Poll is closed' }
    if (poll.expiresAt && poll.expiresAt < new Date()) return { error: 'Poll has expired' }

    // Validate options belong to this poll
    const validOptions = await db.query.pollOptions.findMany({
      where: and(eq(pollOptions.pollId, pollId), sql`${pollOptions.id} IN ${optionIds}`),
    })
    if (validOptions.length !== optionIds.length) return { error: 'Invalid option(s)' }

    if (!poll.allowMultiple && optionIds.length > 1) {
      return { error: 'Only one option allowed' }
    }

    // Remove existing votes for this user on this poll, then insert new ones
    await db
      .delete(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)))

    const voteValues = optionIds.map((optionId) => ({
      pollId,
      optionId,
      userId,
    }))
    await db.insert(pollVotes).values(voteValues)

    return { success: true, poll: await this.enrichPoll(poll, userId) }
  }

  async close(pollId: string, userId: string) {
    const poll = await db.query.polls.findFirst({ where: eq(polls.id, pollId) })
    if (!poll) return null
    if (poll.createdBy !== userId) return null

    const [updated] = await db
      .update(polls)
      .set({ closedAt: new Date() })
      .where(eq(polls.id, pollId))
      .returning()

    return this.enrichPoll(updated!, userId)
  }

  async deletePoll(pollId: string, userId: string) {
    const poll = await db.query.polls.findFirst({ where: eq(polls.id, pollId) })
    if (!poll || poll.createdBy !== userId) return false
    await db.delete(polls).where(eq(polls.id, pollId))
    return true
  }

  private async enrichPoll(poll: typeof polls.$inferSelect, userId: string) {
    const options = await db.query.pollOptions.findMany({
      where: eq(pollOptions.pollId, poll.id),
      orderBy: (o, { asc }) => [asc(o.position)],
    })

    const votes = await db.query.pollVotes.findMany({
      where: eq(pollVotes.pollId, poll.id),
    })

    const userVotes = votes.filter((v) => v.userId === userId).map((v) => v.optionId)

    const optionsWithCount = options.map((opt) => ({
      ...opt,
      voteCount: votes.filter((v) => v.optionId === opt.id).length,
    }))

    return {
      ...poll,
      options: optionsWithCount,
      totalVotes: new Set(votes.map((v) => v.userId)).size,
      userVotes,
    }
  }
}

export const pollsService = new PollsService()
