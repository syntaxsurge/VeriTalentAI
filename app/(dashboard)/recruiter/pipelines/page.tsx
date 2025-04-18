import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { recruiterPipelines } from '@/lib/db/schema/recruiter'

import { createPipelineAction } from './actions'

export const revalidate = 0

export default async function PipelinesPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  const pipelines = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.recruiterId, user.id))

  // Single‑parameter server‑action wrapper
  const createAction = async (formData: FormData): Promise<void> => {
    'use server'
    await createPipelineAction({}, formData)
  }

  return (
    <section className='space-y-10'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>Pipelines</h2>

        {pipelines.length > 0 && (
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              const el = document.getElementById('create-pipeline-form')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            + New Pipeline
          </Button>
        )}
      </div>

      {pipelines.length === 0 ? (
        <p className='text-muted-foreground'>
          You don’t have any pipelines yet. Create your first one below to track candidates through
          your hiring stages.
        </p>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {pipelines.map((p) => (
            <Card key={p.id} className='group transition-shadow hover:shadow-xl'>
              <CardHeader>
                <CardTitle className='truncate' title={p.name}>
                  {p.name}
                </CardTitle>
              </CardHeader>

              <CardContent className='space-y-3 text-sm'>
                <p className='text-muted-foreground line-clamp-3'>
                  {p.description || 'No description provided.'}
                </p>
                <Link href={`/recruiter/pipelines/${p.id}`} className='text-primary underline'>
                  Open Board
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card id='create-pipeline-form' className='max-w-xl'>
        <CardHeader>
          <CardTitle>Create New Pipeline</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={createAction} className='space-y-5'>
            <div>
              <label htmlFor='name' className='mb-1 block text-sm font-medium'>
                Name
              </label>
              <Input id='name' name='name' required placeholder='e.g. Backend Engineer May 2025' />
            </div>

            <div>
              <label htmlFor='description' className='mb-1 block text-sm font-medium'>
                Description
              </label>
              <textarea
                id='description'
                name='description'
                rows={4}
                className='border-border w-full rounded-md border p-2 text-sm'
                placeholder='Optional summary of the role, seniority, location, etc.'
              />
            </div>

            <Button type='submit'>Create Pipeline</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
