'use server'

import { eq } from 'drizzle-orm'

import { issueCredential } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import {
  quizAttempts,
  skillQuizzes,
  candidates,
} from '@/lib/db/schema/viskify'
import { teams, teamMembers } from '@/lib/db/schema/core'
import { openAIAssess } from './openai'

export async function startQuizAction(formData: FormData) {
  const user = await getUser()
  if (!user) return { score: 0, message: 'Not logged in.' }

  const quizId = formData.get('quizId')
  const answer = formData.get('answer')
  if (!quizId || !answer) return { score: 0, message: 'Invalid request.' }

  /* Ensure candidate record exists */
  let [candidateRow] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candidateRow) {
    const [newCand] = await db
      .insert(candidates)
      .values({ userId: user.id, bio: '' })
      .returning()
    candidateRow = newCand
  }

  /* Require team DID */
  const [teamRow] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  const subjectDid = teamRow?.did ?? null
  if (!subjectDid) {
    return { score: 0, message: 'Please create your team DID before taking a quiz.' }
  }

  /* Quiz lookup */
  const [quiz] = await db
    .select()
    .from(skillQuizzes)
    .where(eq(skillQuizzes.id, Number(quizId)))
    .limit(1)
  if (!quiz) return { score: 0, message: 'Quiz not found.' }

  /* AI grading */
  const { aiScore } = await openAIAssess(String(answer), quiz.title)
  const passed = aiScore >= 70
  let vcIssuedId: string | undefined
  let message = `You scored ${aiScore}. ${passed ? 'You passed!' : 'You failed.'}`

  if (passed) {
    try {
      const vc = await issueCredential({
        issuerDid: process.env.PLATFORM_ISSUER_DID || '',
        subjectDid,
        attributes: {
          skillQuiz: quiz.title,
          score: aiScore,
          candidateName: user.name || user.email,
        },
        credentialName: 'SkillPassVC',
      })
      vcIssuedId = vc?.proof?.jwt || 'SkillPassVC'
      message += ' A Skill Pass VC has been issued.'
    } catch (err: any) {
      message += ` (VC issuance failed: ${String(err)})`
    }
  }

  /* Persist attempt */
  await db.insert(quizAttempts).values({
    candidateId: candidateRow.id,
    quizId: quiz.id,
    score: aiScore,
    maxScore: 100,
    pass: passed ? 1 : 0,
    vcIssuedId,
  })

  return { score: aiScore, message }
}