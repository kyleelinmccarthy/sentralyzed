import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { events, eventAttendees, availability } from '../db/schema/calendar.js'
import { users } from '../db/schema/users.js'

export class CalendarService {
  async listEvents(start: string, end: string) {
    return db.query.events.findMany({
      where: and(gte(events.startTime, new Date(start)), lte(events.endTime, new Date(end))),
      orderBy: (e, { asc: a }) => [a(e.startTime)],
    })
  }

  async getEvent(id: string) {
    return db.query.events.findFirst({ where: eq(events.id, id) })
  }

  async createEvent(data: {
    title: string
    description?: string
    startTime: string
    endTime: string
    allDay?: boolean
    recurrenceRule?: string
    location?: string
    createdBy: string
    color?: string
    attendees?: Array<{ userId: string; requirement: 'required' | 'optional' }>
  }) {
    const { attendees, ...eventData } = data
    const [event] = await db
      .insert(events)
      .values({
        ...eventData,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
      })
      .returning()

    const attendeeValues = (attendees ?? []).map((a) => ({
      eventId: event!.id,
      userId: a.userId,
      requirement: a.requirement,
    }))

    // Always add the creator as a required attendee (auto-accepted)
    const creatorAlreadyIncluded = attendeeValues.some((a) => a.userId === data.createdBy)
    if (!creatorAlreadyIncluded) {
      attendeeValues.push({
        eventId: event!.id,
        userId: data.createdBy,
        requirement: 'required' as const,
      })
    }

    await db.insert(eventAttendees).values(attendeeValues)

    // Auto-accept the creator's RSVP
    await db
      .update(eventAttendees)
      .set({ status: 'accepted', respondedAt: new Date() })
      .where(and(eq(eventAttendees.eventId, event!.id), eq(eventAttendees.userId, data.createdBy)))

    return event!
  }

  async updateEvent(
    id: string,
    data: Partial<{
      title: string
      description: string
      startTime: string
      endTime: string
      color: string
      location: string
      attendees: Array<{ userId: string; requirement: 'required' | 'optional' }>
    }>,
  ) {
    const { attendees, ...rest } = data
    const updateData: Record<string, unknown> = { ...rest }
    if (rest.startTime) updateData.startTime = new Date(rest.startTime)
    if (rest.endTime) updateData.endTime = new Date(rest.endTime)
    const [event] = await db.update(events).set(updateData).where(eq(events.id, id)).returning()

    if (attendees !== undefined) {
      await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id))
      if (attendees.length) {
        await db
          .insert(eventAttendees)
          .values(
            attendees.map((a) => ({ eventId: id, userId: a.userId, requirement: a.requirement })),
          )
      }
    }

    return event
  }

  async deleteEvent(id: string) {
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id))
    await db.delete(events).where(eq(events.id, id))
  }

  async rsvp(eventId: string, userId: string, status: 'accepted' | 'declined') {
    await db
      .update(eventAttendees)
      .set({ status, respondedAt: new Date() })
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
  }

  async getAttendees(eventId: string) {
    return db
      .select({
        userId: eventAttendees.userId,
        status: eventAttendees.status,
        requirement: eventAttendees.requirement,
        respondedAt: eventAttendees.respondedAt,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(eventAttendees)
      .innerJoin(users, eq(eventAttendees.userId, users.id))
      .where(eq(eventAttendees.eventId, eventId))
  }

  async setAvailability(
    userId: string,
    slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; timezone?: string }>,
  ) {
    await db.delete(availability).where(eq(availability.userId, userId))
    if (slots.length === 0) return
    await db.insert(availability).values(slots.map((s) => ({ ...s, userId })))
  }

  async getAvailability(userIds: string[]) {
    return db.query.availability.findMany({
      where: sql`${availability.userId} IN ${userIds}`,
    })
  }
}

export const calendarService = new CalendarService()
