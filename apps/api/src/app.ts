import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './routes/auth/index.js'
import { adminInvitations } from './routes/admin/invitations.js'
import { goalsRouter } from './routes/goals/index.js'
import { projectsRouter } from './routes/projects/index.js'
import { tasksRouter } from './routes/tasks/index.js'
import { activitiesRouter } from './routes/activities/index.js'
import { filesRouter } from './routes/files/index.js'

export const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
)

app.get('/', (c) => {
  return c.json({ name: 'Sentralyzed API', version: '0.1.0', status: 'ok' })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Routes
app.route('/auth', auth)
app.route('/admin/invitations', adminInvitations)
app.route('/goals', goalsRouter)
app.route('/projects', projectsRouter)
app.route('/tasks', tasksRouter)
app.route('/activities', activitiesRouter)
app.route('/files', filesRouter)
