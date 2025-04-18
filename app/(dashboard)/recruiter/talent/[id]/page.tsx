import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq, and } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users } from '@/lib/db/schema/core'
import { recruiterPipelines } from '@/lib/db/schema/recruiter'
import {
  candidates,
  candidateCredentials,
  CredentialStatus,
  quizAttempts,
} from '@/lib/db/schema/veritalent'

import { addCandidateToPipelineAction } from '../../pipelines/actions'

export const revalidate = 0

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const candidateId = Number(params.id)

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* Candidate core data */
  const [row] = await db
    .select({
      cand: candidates,
      userRow: users,
    })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) return <div>Candidate not found.</div>

  /* Verified credentials & skill passes */
  const creds = await db
    .select()
    .from(candidateCredentials)
    .where(
      and(
        eq(candidateCredentials.candidateId, candidateId),
        eq(candidateCredentials.status, CredentialStatus.VERIFIED),
      ),
    )

  const passes = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.candidateId, candidateId), eq(quizAttempts.pass, 1)))

  /* Recruiter pipelines for add‑to‑pipeline form */
  const pipelines = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.recruiterId, user.id))

  /* Single‑parameter server‑action wrapper */
  const addToPipelineAction = async (formData: FormData): Promise<void> => {
    'use server'
    await addCandidateToPipelineAction({}, formData)
  }

  return (
    <section className='max-w-2xl space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-2xl font-semibold'>
          {row.userRow?.name || row.userRow?.email || 'Unknown'}
        </h2>
        <p className='text-muted-foreground whitespace-pre-line'>
          {row.cand.bio || 'No bio provided.'}
        </p>
      </div>

      {pipelines.length > 0 && (
        <form action={addToPipelineAction} className='flex items-end gap-3'>
          <input type='hidden' name='candidateId' value={candidateId} />

          <div className='flex flex-1 flex-col'>
            <label htmlFor='pipelineId' className='mb-1 text-sm font-medium'>
              Add to Pipeline
            </label>
            <select
              id='pipelineId'
              name='pipelineId'
              required
              className='border-border h-10 rounded-md border px-2 text-sm'
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button type='submit'>Add</Button>
        </form>
      )}

      {/* Verified credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Credentials</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {creds.length === 0 ? (
            <p className='text-muted-foreground'>None.</p>
          ) : (
            creds.map((c) => (
              <div key={c.id} className='flex items-center justify-between'>
                <span>{c.title}</span>
                {c.fileUrl && (
                  <a
                    href={c.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary underline'
                  >
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Skill passes */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Passes</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {passes.length === 0 ? (
            <p className='text-muted-foreground'>None.</p>
          ) : (
            passes.map((p) => (
              <p key={p.id}>
                Quiz #{p.quizId} — Score {p.score}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      <Link href='/recruiter/talent' className='text-sm underline'>
        ← Back to search
      </Link>
    </section>
  )
}
