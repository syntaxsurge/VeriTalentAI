import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { skillQuizzes } from '@/lib/db/schema/veritalent'

import StartQuizForm from './start-quiz-form'

export const revalidate = 0

export default async function SkillCheckPage() {
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  const quizzes = await db.select().from(skillQuizzes)

  return (
    <section className='space-y-4'>
      <h2 className='text-xl font-semibold'>AI Skill Check</h2>
      <p className='text-muted-foreground text-sm'>
        Pass a quiz and automatically receive a verifiable “Skill Pass”.
      </p>

      {quizzes.length === 0 ? (
        <p>No quizzes found. Seed the database first.</p>
      ) : (
        quizzes.map((quiz) => (
          <div key={quiz.id} className='border-border mb-2 rounded-md border p-4'>
            <h3 className='text-lg font-medium'>{quiz.title}</h3>
            <p className='text-muted-foreground mb-4 text-sm'>{quiz.description}</p>
            <StartQuizForm quiz={quiz} />
          </div>
        ))
      )}
    </section>
  )
}
