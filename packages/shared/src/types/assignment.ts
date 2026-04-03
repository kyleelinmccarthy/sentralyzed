export const ASSIGNABLE_ENTITY_TYPES = [
  'task',
  'project',
  'goal',
  'whiteboard',
  'expense',
  'client',
] as const
export type AssignableEntityType = (typeof ASSIGNABLE_ENTITY_TYPES)[number]

export const ASSIGNMENT_ROLES = ['owner', 'assignee', 'reviewer', 'collaborator', 'viewer'] as const
export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number]

export interface EntityAssignment {
  id: string
  entityType: AssignableEntityType
  entityId: string
  userId: string
  role: AssignmentRole | null
  assignedBy: string
  createdAt: string
}
