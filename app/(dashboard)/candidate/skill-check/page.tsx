import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { skillQuizzes } from '@/lib/db/schema/viskify'
import { teams, teamMembers } from '@/lib/db/schema/core'
import { DidRequiredModal } from '@/components/dashboard/candidate/did-required-modal'
import StartQuizForm from './start-quiz-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const revalidate = 0

export default async function SkillCheckPage() {
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  /* Does the user’s team already have a DID? */
  const [{ did } = {}] =
    await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id))
      .limit(1)

  if (!did) {
    /* Hard‑block with modal */
    return <DidRequiredModal />
  }

  const quizzes = await db.select().from(skillQuizzes)

  return (
    <section className='space-y-6'>
      <header className='max-w-2xl space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>AI Skill Check</h1>
        <p className='text-muted-foreground text-sm'>
          Pass a quiz to instantly earn a verifiable <strong>Skill Pass</strong> credential.
        </p>
      </header>

      {quizzes.length === 0 ? (
        <p className='text-muted-foreground'>No quizzes found. Seed the database first.</p>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className='group relative overflow-hidden transition-shadow hover:shadow-xl'
            >
              <CardHeader>
                <CardTitle className='line-clamp-2 min-h-[3rem]'>{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <p className='text-muted-foreground line-clamp-3 flex-1 text-sm'>
                  {quiz.description}
                </p>
                <StartQuizForm quiz={quiz} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}