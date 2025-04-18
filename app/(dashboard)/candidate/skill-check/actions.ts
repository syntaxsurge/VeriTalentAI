'use server'

import { eq } from 'drizzle-orm'

import { issueCredential } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { quizAttempts, skillQuizzes, candidates } from '@/lib/db/schema/veritalent'

import { openAIAssess } from './openai'

export async function startQuizAction(formData: FormData) {
  const user = await getUser()
  if (!user) {
    return { score: 0, message: 'Not logged in.' }
  }

  const quizId = formData.get('quizId')
  const answer = formData.get('answer')

  if (!quizId || !answer) {
    return { score: 0, message: 'Invalid request.' }
  }

  // ensure candidate record exists
  let [candidateRow] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candidateRow) {
    const [newCand] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
    candidateRow = newCand
  }

  const [quiz] = await db
    .select()
    .from(skillQuizzes)
    .where(eq(skillQuizzes.id, Number(quizId)))
    .limit(1)

  if (!quiz) {
    return { score: 0, message: 'Quiz not found.' }
  }

  const maxScore = 100
  const { aiScore } = await openAIAssess(String(answer), quiz.title)

  const passThreshold = 70
  const passFlag = aiScore >= passThreshold ? 1 : 0
  let vcIssuedId: string | undefined
  let message = `You scored ${aiScore}. ${passFlag ? 'You passed!' : 'You failed.'}`

  if (passFlag) {
    try {
      const vc = await issueCredential({
        issuerDid: process.env.COMPANY_ISSUER_DID || 'did:cheqd:testnet:exampleIssuerCompany',
        subjectDid: process.env.SUBJECT_DID || 'did:cheqd:testnet:exampleCandidateSubject',
        attributes: {
          skillQuiz: quiz.title,
          score: aiScore,
          candidateName: user.name || user.email,
        },
        credentialName: 'SkillPassVC',
      })
      vcIssuedId = vc?.proof?.jwt || 'AiSkillCheckVC'
      message += ' A skill pass VC was issued!'
    } catch (err: any) {
      message += ` (Error issuing VC: ${String(err)})`
    }
  }

  await db.insert(quizAttempts).values({
    candidateId: candidateRow.id,
    quizId: quiz.id,
    score: aiScore,
    maxScore,
    pass: passFlag,
    vcIssuedId,
  })

  return { score: aiScore, message }
}
