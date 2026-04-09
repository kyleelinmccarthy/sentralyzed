import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { users } from '../schema/users.js'
import { goals } from '../schema/goals.js'
import { projects, projectMembers } from '../schema/projects.js'
import { tasks } from '../schema/tasks.js'
import { clients } from '../schema/clients.js'
import { assets } from '../schema/assets.js'
import { entityAssignments } from '../schema/assignments.js'

async function seedData() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://sentral:devpassword123@localhost:5433/sentral_dev'
  const client = postgres(connectionString)
  const db = drizzle(client)

  console.log('Seeding data...')

  // Clean up any previous seed data to make this idempotent
  console.log('Cleaning up previous seed data...')
  await client`DELETE FROM entity_assignments`
  await client`DELETE FROM project_members`
  await client`DELETE FROM task_comments`
  await client`DELETE FROM tasks`
  await client`DELETE FROM expenses`
  await client`DELETE FROM assets`
  await client`DELETE FROM client_projects`
  await client`DELETE FROM clients`
  await client`DELETE FROM projects`
  await client`DELETE FROM goals`
  console.log('  Cleaned up.')

  // Get admin users
  const adminOne = await db.select().from(users).where(eq(users.email, 'admin@solvre.tech'))
  const adminTwo = await db.select().from(users).where(eq(users.email, 'admin2@solvre.tech'))
  const adminThree = await db.select().from(users).where(eq(users.email, 'manager@solvre.tech'))

  if (!adminOne[0] || !adminTwo[0] || !adminThree[0]) {
    console.error(
      'Admin users not found. Run the base seed first: npm run db:seed --workspace=@sentral/api',
    )
    await client.end()
    process.exit(1)
  }

  const a1 = adminOne[0].id
  const a2 = adminTwo[0].id
  const a3 = adminThree[0].id
  const allAdmins = [a1, a2, a3]

  // ──────────────────────────────────────
  // GOALS
  // ──────────────────────────────────────
  console.log('Creating goals...')
  const insertedGoals = await db
    .insert(goals)
    .values([
      { title: 'Make FU Money', level: 'company', ownerId: a1 },
      { title: 'Make more money than [] in a year', level: 'company', ownerId: a1 },
      { title: 'Quit', level: 'company', ownerId: a1 },
      { title: 'Build Cool Shit', level: 'company', ownerId: a1 },
      {
        title: 'Sell first product/subscription/get first recurring client',
        level: 'company',
        ownerId: a1,
      },
    ])
    .returning()

  console.log(`  Created ${insertedGoals.length} goals`)

  // ──────────────────────────────────────
  // PROJECTS
  // ──────────────────────────────────────
  console.log('Creating projects...')
  const insertedProjects = await db
    .insert(projects)
    .values([
      { name: 'Timeglass App', ownerId: a1 },
      { name: 'Family "Social Media" Alternative App', ownerId: a1 },
      { name: 'Template Website Builder for small to medium businesses', ownerId: a1 },
      { name: 'Sentral App', ownerId: a1 },
      { name: 'Nudge App', ownerId: a1 },
      { name: '3D Modeling App', ownerId: a1 },
      { name: 'Homeschool Platform for socialization/meetups', ownerId: a1 },
      { name: 'Kingdoms & Crowns Homeschool Game & Learning Tracker App', ownerId: a1 },
      { name: 'Budgeting App', ownerId: a1 },
      { name: 'Enzyme App for clean code', ownerId: a1 },
      { name: 'Car Wash Inventory App', ownerId: a1 },
      { name: 'Car Pool App', ownerId: a1 },
      { name: 'Tattoo Website', ownerId: a1 },
      { name: 'Floral Store Website', ownerId: a1 },
      { name: 'Do the Things simple productivity App', ownerId: a1 },
    ])
    .returning()

  console.log(`  Created ${insertedProjects.length} projects`)

  // Add all admins as project members
  console.log('Adding project members...')
  const memberValues = insertedProjects.flatMap((p) =>
    allAdmins.map((userId) => ({
      projectId: p.id,
      userId,
      role: 'contributor' as const,
    })),
  )
  await db.insert(projectMembers).values(memberValues)

  // Build project lookup by name
  const projectByName = Object.fromEntries(insertedProjects.map((p) => [p.name, p.id]))
  const timeglassId = projectByName['Timeglass App']
  const sentralId = projectByName['Sentral App']

  // ──────────────────────────────────────
  // TASKS
  // ──────────────────────────────────────
  console.log('Creating tasks...')
  const insertedTasks = await db
    .insert(tasks)
    .values([
      // Company tasks (no project)
      {
        title: 'Finalize Operating Agreement',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'File for LLC',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'File for Trademark on Solvre Tech',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Finalize Mission Statement',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Finalize Company Logo',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Finalize Company Website',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Host first app with users/subscription',
        level: 'company',
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      // TimeGlass project tasks
      {
        title: 'Build the app',
        level: 'project',
        projectId: timeglassId,
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Test the app',
        level: 'project',
        projectId: timeglassId,
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Use the app',
        level: 'project',
        projectId: timeglassId,
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      // Sentral project tasks
      {
        title: 'Build the app',
        level: 'project',
        projectId: sentralId,
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Test the app',
        level: 'project',
        projectId: sentralId,
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
      {
        title: 'Use the app',
        level: 'project',
        projectId: sentralId,
        status: 'todo',
        priority: 'medium',
        reporterId: a1,
      },
    ])
    .returning()

  console.log(`  Created ${insertedTasks.length} tasks`)

  // ──────────────────────────────────────
  // CLIENTS
  // ──────────────────────────────────────
  console.log('Creating clients...')
  const insertedClients = await db
    .insert(clients)
    .values([
      { name: 'Anthem Tattoo', status: 'lead', ownerId: a1 },
      { name: 'Mister Car Wash', status: 'lead', ownerId: a1 },
      { name: 'Mrs. Suchow', status: 'active', ownerId: a1 },
    ])
    .returning()

  console.log(`  Created ${insertedClients.length} clients`)

  // ──────────────────────────────────────
  // EXPENSES
  // ──────────────────────────────────────
  console.log('Creating expenses...')
  const today = new Date().toISOString().split('T')[0]!
  // Use raw SQL to avoid Drizzle trying to insert user_id column that doesn't exist in DB yet
  const expenseRows = [
    {
      desc: 'Claude Code subscriptions',
      cents: 21000,
      cat: 'software_subscriptions',
      freq: 'monthly',
      notes: null as string | null,
    },
    {
      desc: 'Notary Fee',
      cents: 3000,
      cat: 'legal',
      freq: 'one_time',
      notes: null as string | null,
    },
    { desc: 'Trademark Fee', cents: 67500, cat: 'legal', freq: 'one_time', notes: '5-Year life' },
    {
      desc: 'Domain Fee for Solvre Tech',
      cents: 1000,
      cat: 'software_subscriptions',
      freq: 'annually',
      notes: null as string | null,
    },
    {
      desc: 'Filing Fee for LLC',
      cents: 15900,
      cat: 'operating',
      freq: 'one_time',
      notes: null as string | null,
    },
    {
      desc: 'Report Fee for LLC',
      cents: 2000,
      cat: 'operating',
      freq: 'annually',
      notes: null as string | null,
    },
    {
      desc: 'Registered Agent Fee',
      cents: 9900,
      cat: 'operating',
      freq: 'annually',
      notes: null as string | null,
    },
    {
      desc: 'Internet Costs',
      cents: 30000,
      cat: 'utilities',
      freq: 'monthly',
      notes: null as string | null,
    },
    {
      desc: 'Commute cost (Admin 3)',
      cents: 8000,
      cat: 'travel',
      freq: 'monthly',
      notes: null as string | null,
    },
    {
      desc: 'Commute Cost (Admin 2)',
      cents: 8000,
      cat: 'travel',
      freq: 'monthly',
      notes: null as string | null,
    },
  ]
  const insertedExpenses = []
  for (const row of expenseRows) {
    const result = await client`
      INSERT INTO expenses (description, amount_cents, category, frequency, date, submitted_by, status, notes)
      VALUES (${row.desc}, ${row.cents}, ${row.cat}::expense_category, ${row.freq}::expense_frequency, ${today}, ${a1}, 'approved'::expense_status, ${row.notes ?? null})
      RETURNING id
    `
    insertedExpenses.push(result[0])
  }

  console.log(`  Created ${insertedExpenses.length} expenses`)

  // ──────────────────────────────────────
  // ASSETS
  // ──────────────────────────────────────
  console.log('Creating assets...')
  const insertedAssets = await db
    .insert(assets)
    .values([
      {
        name: 'Server/Rack',
        category: 'equipment',
        status: 'in_use',
        assignedToId: a3,
        createdBy: a1,
      },
    ])
    .returning()

  console.log(`  Created ${insertedAssets.length} assets`)

  // ──────────────────────────────────────
  // ASSIGNMENTS (all goals, tasks, projects → all 3 admins)
  // ──────────────────────────────────────
  console.log('Creating assignments...')
  const assignmentValues = [
    ...insertedGoals.flatMap((g) =>
      allAdmins.map((userId) => ({
        entityType: 'goal',
        entityId: g.id,
        userId,
        assignedBy: a1,
      })),
    ),
    ...insertedTasks.flatMap((t) =>
      allAdmins.map((userId) => ({
        entityType: 'task',
        entityId: t.id,
        userId,
        assignedBy: a1,
      })),
    ),
    ...insertedProjects.flatMap((p) =>
      allAdmins.map((userId) => ({
        entityType: 'project',
        entityId: p.id,
        userId,
        assignedBy: a1,
      })),
    ),
  ]

  await db.insert(entityAssignments).values(assignmentValues)
  console.log(`  Created ${assignmentValues.length} assignments`)

  // ──────────────────────────────────────
  console.log('\nSeed data complete!')
  console.log(`  Goals: ${insertedGoals.length}`)
  console.log(`  Projects: ${insertedProjects.length}`)
  console.log(`  Tasks: ${insertedTasks.length}`)
  console.log(`  Clients: ${insertedClients.length}`)
  console.log(`  Expenses: ${insertedExpenses.length}`)
  console.log(`  Assets: ${insertedAssets.length}`)
  console.log(`  Assignments: ${assignmentValues.length}`)

  await client.end()
}

seedData().catch(console.error)
