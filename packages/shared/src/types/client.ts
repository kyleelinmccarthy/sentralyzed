export const CLIENT_STATUSES = ['lead', 'active', 'inactive', 'churned'] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const CLIENT_PROJECT_ROLES = ['sponsor', 'stakeholder', 'end_user'] as const
export type ClientProjectRole = (typeof CLIENT_PROJECT_ROLES)[number]

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  status: ClientStatus
  ownerId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ClientProject {
  id: string
  clientId: string
  projectId: string
  role: ClientProjectRole
  startDate: string | null
  endDate: string | null
  createdAt: string
}
