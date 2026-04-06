import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { calendarService } from '../../services/calendar.service.js'
import type { AppEnv } from '../../types.js'

const calendarRouter = new Hono<AppEnv>()
calendarRouter.use('*', authMiddleware)

calendarRouter.get('/events', async (c) => {
  const start = c.req.query('start') || new Date().toISOString()
  const end = c.req.query('end') || new Date(Date.now() + 30 * 86400000).toISOString()
  const eventList = await calendarService.listEvents(start, end)
  return c.json({ events: eventList })
})

calendarRouter.get('/events/:id', async (c) => {
  const event = await calendarService.getEvent(c.req.param('id'))
  if (!event) return c.json({ error: 'Event not found' }, 404)
  return c.json({ event })
})

calendarRouter.post(
  '/events',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      allDay: z.boolean().optional(),
      recurrenceRule: z.string().optional(),
      location: z.string().optional(),
      color: z.string().optional(),
      attendees: z
        .array(
          z.object({
            userId: z.string().uuid(),
            requirement: z.enum(['required', 'optional']),
          }),
        )
        .optional(),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    const event = await calendarService.createEvent({ ...c.req.valid('json'), createdBy: user.id })
    return c.json({ event }, 201)
  },
)

calendarRouter.patch(
  '/events/:id',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().nullable().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      color: z.string().optional(),
      location: z.string().nullable().optional(),
      attendees: z
        .array(
          z.object({
            userId: z.string().uuid(),
            requirement: z.enum(['required', 'optional']),
          }),
        )
        .optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid('json')
    const event = await calendarService.updateEvent(c.req.param('id'), {
      ...body,
      description: body.description ?? undefined,
      location: body.location ?? undefined,
    })
    if (!event) return c.json({ error: 'Event not found' }, 404)
    return c.json({ event })
  },
)

calendarRouter.delete('/events/:id', async (c) => {
  await calendarService.deleteEvent(c.req.param('id'))
  return c.json({ ok: true })
})

calendarRouter.patch(
  '/events/:id/rsvp',
  zValidator(
    'json',
    z.object({
      status: z.enum(['accepted', 'declined']),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    await calendarService.rsvp(c.req.param('id'), user.id, c.req.valid('json').status)
    return c.json({ ok: true })
  },
)

calendarRouter.get('/events/:id/attendees', async (c) => {
  const attendees = await calendarService.getAttendees(c.req.param('id'))
  return c.json({ attendees })
})

calendarRouter.put(
  '/availability',
  zValidator(
    'json',
    z.object({
      slots: z.array(
        z.object({
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string(),
          endTime: z.string(),
          timezone: z.string().optional(),
        }),
      ),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    await calendarService.setAvailability(user.id, c.req.valid('json').slots)
    return c.json({ ok: true })
  },
)

calendarRouter.get('/availability', async (c) => {
  const users = c.req.query('users')?.split(',') || []
  const slots = await calendarService.getAvailability(users)
  return c.json({ availability: slots })
})

export { calendarRouter }
