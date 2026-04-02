import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { securityHeaders, rateLimit } from './middleware/security.js'
import { auth } from './routes/auth/index.js'
import { adminInvitations } from './routes/admin/invitations.js'
import { adminUsersRouter } from './routes/admin/users.js'
import { goalsRouter } from './routes/goals/index.js'
import { projectsRouter } from './routes/projects/index.js'
import { tasksRouter } from './routes/tasks/index.js'
import { activitiesRouter } from './routes/activities/index.js'
import { filesRouter } from './routes/files/index.js'
import { chatRouter } from './routes/chat/index.js'
import { forumsRouter } from './routes/forums/index.js'
import { githubRouter } from './routes/github/index.js'
import { calendarRouter } from './routes/calendar/index.js'

export const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', securityHeaders())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
)

// Rate limiting: stricter on auth, general on API
app.use('/auth/*', rateLimit(20, 15 * 60 * 1000)) // 20 req / 15 min
app.use('*', rateLimit(200, 60 * 1000)) // 200 req / min

// Health & info
app.get('/', (c) => {
  return c.json({ name: 'Sentralyzed API', version: '0.1.0', status: 'ok' })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Routes
app.route('/auth', auth)
app.route('/admin/invitations', adminInvitations)
app.route('/admin/users', adminUsersRouter)
app.route('/goals', goalsRouter)
app.route('/projects', projectsRouter)
app.route('/tasks', tasksRouter)
app.route('/activities', activitiesRouter)
app.route('/files', filesRouter)
app.route('/chat', chatRouter)
app.route('/forums', forumsRouter)
app.route('/github', githubRouter)
app.route('/calendar', calendarRouter)
