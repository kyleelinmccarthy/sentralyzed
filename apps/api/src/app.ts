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
import { feedbackRouter } from './routes/feedback/index.js'
import { assignmentsRouter } from './routes/assignments/index.js'
import { whiteboardsRouter } from './routes/whiteboards/index.js'
import { expensesRouter } from './routes/expenses/index.js'
import { entityLinksRouter } from './routes/entity-links/index.js'
import { clientsRouter } from './routes/clients/index.js'
import { pollsRouter } from './routes/polls/index.js'
import { pinRouter } from './routes/pins/index.js'
import { assetsRouter } from './routes/assets/index.js'
import { dashboardRouter } from './routes/dashboard/index.js'

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
app.route('/feedback', feedbackRouter)
app.route('/assignments', assignmentsRouter)
app.route('/whiteboards', whiteboardsRouter)
app.route('/expenses', expensesRouter)
app.route('/entity-links', entityLinksRouter)
app.route('/clients', clientsRouter)
app.route('/polls', pollsRouter)
app.route('/pins', pinRouter)
app.route('/assets', assetsRouter)
app.route('/dashboard', dashboardRouter)
