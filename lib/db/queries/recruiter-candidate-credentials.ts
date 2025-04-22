import { db } from '../drizzle'
import {
  candidateCredentials as credsT,
  CredentialStatus,
} from '../schema/viskify'
import { issuers as issuersT } from '../schema/issuer'
import { eq, ilike, and, asc, desc, sql } from 'drizzle-orm'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RecruiterCredentialRow = {
  id: number
  title: string
  issuer: string | null
  status: CredentialStatus
  verified: boolean
  fileUrl: string | null
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                             Paginated fetch                                */
/* -------------------------------------------------------------------------- */

export async function getRecruiterCandidateCredentialsPage(
  candidateId: number,
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'issuer' | 'status' | 'createdAt' | 'id' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: RecruiterCredentialRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const secondary =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(credsT.title)
        : desc(credsT.title)
      : sortBy === 'issuer'
        ? order === 'asc'
          ? asc(issuersT.name)
          : desc(issuersT.name)
        : sortBy === 'status'
          ? order === 'asc'
            ? asc(credsT.status)
            : desc(credsT.status)
          : sortBy === 'createdAt'
            ? order === 'asc'
              ? asc(credsT.createdAt)
              : desc(credsT.createdAt)
            : order === 'asc'
              ? asc(credsT.id)
              : desc(credsT.id)

  /* Always keep verified credentials on top. */
  const orderBy = [desc(credsT.verified), secondary]

  /* ----------------------------- WHERE clause ---------------------------- */
  const where =
    searchTerm.trim().length === 0
      ? eq(credsT.candidateId, candidateId)
      : and(
          eq(credsT.candidateId, candidateId),
          ilike(credsT.title, `%${searchTerm}%`),
        )

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: credsT.id,
      title: credsT.title,
      issuer: issuersT.name,
      status: credsT.status,
      verified: credsT.verified,
      fileUrl: credsT.fileUrl,
      createdAt: credsT.createdAt,
    })
    .from(credsT)
    .leftJoin(issuersT, eq(credsT.issuerId, issuersT.id))
    .where(where as any)
    .orderBy(...orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { credentials: rows as RecruiterCredentialRow[], hasNext }
}