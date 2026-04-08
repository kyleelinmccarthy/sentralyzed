import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { tasksService } from '../../services/tasks.service.js'
import type { AppEnv } from '../../types.js'

const tasksRouter = new Hono<AppEnv>()

tasksRouter.use('*', authMiddleware)

const taskLevelEnum = z.enum(['project', 'team', 'company'])

const createTaskSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.unknown().optional(),
    projectId: z.string().uuid().optional(),
    level: taskLevelEnum.optional(),
    assigneeId: z.string().uuid().optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
    dueDate: z.string().optional(),
    labels: z.array(z.string()).optional(),
  })
  .refine((data) => data.level !== 'project' || data.projectId, {
    message: 'projectId is required for project-level tasks',
    path: ['projectId'],
  })

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.unknown().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  position: z.number().int().optional(),
  labels: z.array(z.string()).optional(),
})

// List tasks by level (team or company)
tasksRouter.get('/level/:level', async (c) => {
  const level = c.req.param('level')
  if (!['team', 'company'].includes(level)) {
    return c.json({ error: 'Invalid level. Use "team" or "company"' }, 400)
  }
  const tasksList = await tasksService.listByLevel(level as 'team' | 'company', {
    status: c.req.query('status'),
    assigneeId: c.req.query('assigneeId'),
    priority: c.req.query('priority'),
  })
  return c.json({ tasks: tasksList })
})

// List tasks for a project
tasksRouter.get('/project/:projectId', async (c) => {
  const tasksList = await tasksService.listByProject(c.req.param('projectId'), {
    status: c.req.query('status'),
    assigneeId: c.req.query('assigneeId'),
    priority: c.req.query('priority'),
  })
  return c.json({ tasks: tasksList })
})

// Get single task
tasksRouter.get('/:id', async (c) => {
  const task = await tasksService.getById(c.req.param('id'))
  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json({ task })
})

// Create task
tasksRouter.post('/', zValidator('json', createTaskSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  const task = await tasksService.create({
    ...data,
    reporterId: user.id,
    actorName: user.name,
  })
  return c.json({ task }, 201)
})

// Update task
tasksRouter.patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
  const user = c.get('user')
  const task = await tasksService.update(c.req.param('id'), c.req.valid('json'), user.id, user.name)
  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json({ task })
})

// Reorder tasks
tasksRouter.put(
  '/reorder',
  zValidator(
    'json',
    z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          status: z.enum(['todo', 'in_progress', 'in_review', 'done']),
          position: z.number().int(),
        }),
      ),
    }),
  ),
  async (c) => {
    const { items } = c.req.valid('json')
    await tasksService.reorder(items)
    return c.json({ ok: true })
  },
)

// Task comments
tasksRouter.get('/:id/comments', async (c) => {
  const comments = await tasksService.getComments(c.req.param('id'))
  return c.json({ comments })
})

tasksRouter.post(
  '/:id/comments',
  zValidator('json', z.object({ content: z.string().min(1) })),
  async (c) => {
    const user = c.get('user')
    const comment = await tasksService.addComment(
      c.req.param('id'),
      user.id,
      c.req.valid('json').content,
      user.name,
    )
    return c.json({ comment }, 201)
  },
)

// Delete task (soft)
tasksRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const task = await tasksService.softDelete(c.req.param('id'), user.id, user.name)
  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json({ ok: true })
})

export { tasksRouter }
