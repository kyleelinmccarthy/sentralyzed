import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { events, eventAttendees, availability } from '../db/schema/calendar.js'

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
    attendeeIds?: string[]
  }) {
    const { attendeeIds, ...eventData } = data
    const [event] = await db
      .insert(events)
      .values({
        ...eventData,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
      })
      .returning()

    if (attendeeIds?.length) {
      await db
        .insert(eventAttendees)
        .values(attendeeIds.map((userId) => ({ eventId: event!.id, userId })))
    }

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
    }>,
  ) {
    const updateData: Record<string, unknown> = { ...data }
    if (data.startTime) updateData.startTime = new Date(data.startTime)
    if (data.endTime) updateData.endTime = new Date(data.endTime)
    const [event] = await db.update(events).set(updateData).where(eq(events.id, id)).returning()
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
    return db.query.eventAttendees.findMany({ where: eq(eventAttendees.eventId, eventId) })
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
