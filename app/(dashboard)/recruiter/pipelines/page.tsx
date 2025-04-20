import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { recruiterPipelines } from '@/lib/db/schema/recruiter'

import CreatePipelineForm from './create-pipeline-form'

export const revalidate = 0

export default async function PipelinesPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  const pipelines = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.recruiterId, user.id))

  return (
    <section className='space-y-10'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>Pipelines</h2>

        {pipelines.length > 0 && (
          <Button asChild size='sm' variant='outline'>
            <a href='#create-pipeline-form'>+ New Pipeline</a>
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
                  Open Board
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New pipeline form */}
      <CreatePipelineForm />
    </section>
  )
}