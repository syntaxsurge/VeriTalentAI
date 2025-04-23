import { and, desc, eq, like, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { issuers } from '@/lib/db/schema/issuer'
import {
  candidates,
  candidateCredentials,
  type CandidateCredential,
} from '@/lib/db/schema/viskify'

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

/** Columns that callers may sort by (case-insensitive). */
export type SortKey = 'id' | 'title' | 'type' | 'status' | 'issuer'
export type SortOrder = 'asc' | 'desc'

export interface CredentialRow
  extends Pick<CandidateCredential, 'id' | 'title' | 'type' | 'status' | 'vcJson'> {
  /** Display name of the issuer (nullable). */
  issuer: string | null
}

export interface CredentialsPage {
  credentials: CredentialRow[]
  hasNext: boolean
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

function buildOrder(sort: SortKey, order: SortOrder) {
  const dir = order === 'asc' ? sql`ASC` : sql`DESC`

  switch (sort) {
    case 'title':
      return sql`lower(${candidateCredentials.title}) ${dir}`
    case 'type':
      return sql`lower(${candidateCredentials.type}) ${dir}`
    case 'status':
      return sql`lower(${candidateCredentials.status}) ${dir}`
    case 'issuer':
      return sql`lower(${issuers.name}) ${dir}`
    case 'id':
    default:
      return order === 'asc'
        ? candidateCredentials.id
        : desc(candidateCredentials.id) /* default desc for newest first */
  }
}

/* -------------------------------------------------------------------------- */
/*                              Q U E R Y                                     */
/* -------------------------------------------------------------------------- */

/**
 * Return one page of the signed-in user's candidate credentials.
 *
 * @param userId   Authenticated user id
 * @param page     1-based page index
 * @param pageSize Items per page (10/20/50)
 * @param sort     Column to sort by
 * @param order    asc | desc
 * @param search   Case-insensitive search term against title / type / issuer
 */
export async function getCandidateCredentialsPage(
  userId: number,
  page: number,
  pageSize: number,
  sort: SortKey = 'id',
  order: SortOrder = 'desc',
  search: string = '',
): Promise<CredentialsPage> {
  const offset = (page - 1) * pageSize
  const term = search.trim().toLowerCase()
  const hasSearch = term.length > 0

  /* ------------------------------ Base query ----------------------------- */
  const query = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      type: candidateCredentials.type,
      status: candidateCredentials.status,
      vcJson: candidateCredentials.vcJson,
      issuer: issuers.name,
    })
    .from(candidateCredentials)
    .innerJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidates.userId, userId))

  /* ------------------------------ Search --------------------------------- */
  if (hasSearch) {
    query.where(
      and(
        eq(candidates.userId, userId),
        sql`(
          lower(${candidateCredentials.title})     ${like('%' + term + '%')} OR
          lower(${candidateCredentials.type})      ${like('%' + term + '%')} OR
          lower(${candidateCredentials.status})    ${like('%' + term + '%')} OR
          lower(coalesce(${issuers.name}, ''))     ${like('%' + term + '%')}
        )`,
      ),
    )
  }

  /* ------------------------------ Ordering ------------------------------- */
  query.orderBy(buildOrder(sort, order))

  /* ------------------------------ Paging --------------------------------- */
  query.limit(pageSize + 1).offset(offset) // fetch one extra row to detect next page

  const rows = await query

  return {
    credentials: rows.slice(0, pageSize),
    hasNext: rows.length > pageSize,
  }
}