import { eq, and, isNull, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { clients, clientProjects } from '../db/schema/clients.js'
import type { ClientStatus, ClientProjectRole } from '@sentralyzed/shared/types/client'
import { whereActiveById, softDelete } from './utils/db-helpers.js'

export class ClientsService {
  async list(filters?: { status?: string; search?: string }) {
    const conditions = [isNull(clients.deletedAt)]

    if (filters?.status) {
      conditions.push(eq(clients.status, filters.status as ClientStatus))
    }

    return db.query.clients.findMany({
      where: and(...conditions),
      orderBy: [asc(clients.name)],
    })
  }

  async getById(id: string) {
    return db.query.clients.findFirst({
      where: whereActiveById(clients.id, id, clients.deletedAt),
    })
  }

  async create(data: {
    name: string
    email?: string
    phone?: string
    company?: string
    notes?: string
    status?: ClientStatus
    ownerId: string
  }) {
    const [client] = await db.insert(clients).values(data).returning()
    return client!
  }

  async update(
    id: string,
    data: Partial<{
      name: string
      email: string | null
      phone: string | null
      company: string | null
      notes: string | null
      status: ClientStatus
    }>,
  ) {
    const [client] = await db.update(clients).set(data).where(eq(clients.id, id)).returning()
    return client
  }

  async softDelete(id: string) {
    return softDelete(clients, clients.id, id)
  }

  async addProject(
    clientId: string,
    projectId: string,
    role: ClientProjectRole = 'stakeholder',
    startDate?: Date,
    endDate?: Date,
  ) {
    const [association] = await db
      .insert(clientProjects)
      .values({ clientId, projectId, role, startDate, endDate })
      .returning()
    return association!
  }

  async removeProject(clientId: string, projectId: string) {
    await db
      .delete(clientProjects)
      .where(and(eq(clientProjects.clientId, clientId), eq(clientProjects.projectId, projectId)))
  }

  async getProjects(clientId: string) {
    return db.query.clientProjects.findMany({
      where: eq(clientProjects.clientId, clientId),
    })
  }
}

export const clientsService = new ClientsService()
