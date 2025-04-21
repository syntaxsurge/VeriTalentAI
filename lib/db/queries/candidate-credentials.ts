import { asc, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  candidateCredentials as credsT,
  CredentialStatus,
} from '../schema/viskify'
import { issuers as issuersT } from '../schema/issuer'

export type CandidateCredentialRow = {
  id: number
  title: string
  type: string
  issuer: string | null
  status: CredentialStatus
}

/**
 * Return a single page of credentials for a candidate with optional full‑text
 * search, sorting and pagination – mirrors the helpers used by activity‑log
 * and team‑member tables.
 */
export async function getCandidateCredentialsPage(
  candidateId: number,
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'type' | 'issuer' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: CandidateCredentialRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* ------------------------------ ORDER BY ------------------------------ */
  const orderBy =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(credsT.title)
        : desc(credsT.title)
      : sortBy === 'type'
        ? order === 'asc'
          ? asc(credsT.type)
          : desc(credsT.type)
        : sortBy === 'issuer'
          ? order === 'asc'
            ? asc(issuersT.name)
            : desc(issuersT.name)
          : sortBy === 'status'
            ? order === 'asc'
              ? asc(credsT.status)
              : desc(credsT.status)
            : /* id fallback */
              order === 'asc'
                ? asc(credsT.id)
                : desc(credsT.id)

  /* ------------------------------ WHERE --------------------------------- */
  const baseWhere = eq(credsT.candidateId, candidateId)

  const whereClause =
    searchTerm.trim().length === 0
      ? baseWhere
      : or(
          baseWhere,
          ilike(credsT.title, `%${searchTerm}%`),
          ilike(credsT.type, `%${searchTerm}%`),
          ilike(issuersT.name, `%${searchTerm}%`),
        )

  /* ------------------------------ QUERY ---------------------------------- */
  const rows = await db
    .select({
      id: credsT.id,
      title: credsT.title,
      type: credsT.type,
      issuer: issuersT.name,
      status: credsT.status,
    })
    .from(credsT)
    .leftJoin(issuersT, eq(credsT.issuerId, issuersT.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize + 1) // grab one extra to detect "hasNext"
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { credentials: rows, hasNext }
}