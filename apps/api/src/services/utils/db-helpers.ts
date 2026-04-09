import { eq, and, isNull } from 'drizzle-orm'
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core'
import { db } from '../../db/index.js'

export const DEFAULT_PAGE_LIMIT = 50

/**
 * Creates a where condition for finding a non-deleted record by ID.
 */
export function whereActiveById(idColumn: PgColumn, id: string, deletedAtColumn: PgColumn) {
  return and(eq(idColumn, id), isNull(deletedAtColumn))
}

/**
 * Soft-deletes a record by setting deletedAt to now.
 * Returns the updated record or undefined if not found.
 */
export async function softDelete<T extends PgTable>(table: T, idColumn: PgColumn, id: string) {
  const [record] = await db
    .update(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic table type doesn't include deletedAt column
    .set({ deletedAt: new Date() } as Record<string, unknown> as any)
    .where(eq(idColumn, id))
    .returning()
  return record
}

/**
 * Checks ownership for member-role access control.
 * Returns true if the user is allowed to access the resource.
 */
export function canAccessAsOwner(
  role: 'admin' | 'manager' | 'member',
  resourceOwnerId: string,
  userId: string,
): boolean {
  if (role !== 'member') return true
  return resourceOwnerId === userId
}

/**
 * Deduplicates an array of user IDs, filtering out nulls and a specific actor.
 */
export function getUniqueNotifyIds(
  userIds: (string | null | undefined)[],
  excludeActorId?: string,
): string[] {
  const filtered = userIds.filter((uid): uid is string => !!uid && uid !== excludeActorId)
  return [...new Set(filtered)]
}
