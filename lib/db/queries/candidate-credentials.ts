import { db } from '@/lib/db/drizzle'
import {
  candidateCredentials as credT,
  CredentialStatus,
} from '@/lib/db/schema/viskify'
import { issuers } from '@/lib/db/schema/issuer'
import { eq, and, ilike, sql } from 'drizzle-orm'

export async function getCandidateCredentialsPage(
  candidateId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'type' | 'issuer' | 'status' | 'id',
  order: 'asc' | 'desc',
  searchTerm: string,
) {
  const offset = (page - 1) * pageSize

  /* Compose where clause */
  const conditions = [eq(credT.candidateId, candidateId)]
  if (searchTerm) {
    conditions.push(
      ilike(sql`lower(${credT.title})`, `%${searchTerm}%`) as any,
    )
  }

  /* Main query */
  const credentials = await db
    .select({
      id: credT.id,
      title: credT.title,
      type: credT.type,
      issuer: issuers.name,
      status: credT.status,
      vcJson: credT.vcJson,
    })
    .from(credT)
    .leftJoin(issuers, eq(credT.issuerId, issuers.id))
    .where(and(...conditions))
    .orderBy(sort === 'issuer' ? issuers.name : (credT as any)[sort], order)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = credentials.length > pageSize
  if (hasNext) credentials.pop()

  return { credentials, hasNext }
}