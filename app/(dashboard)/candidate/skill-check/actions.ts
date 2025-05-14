'use server'

import { eq } from 'drizzle-orm'

import { openAIAssess } from '@/lib/ai/openai' /* ← centralised helper */
import { requireAuth } from '@/lib/auth/guards'
import { issueCredential } from '@/lib/cheqd'
import { PLATFORM_ISSUER_DID } from '@/lib/config'
import { getVeridaToken } from '@/lib/db/queries/queries'
import { db } from '@/lib/db/drizzle'
import { candidates, skillQuizzes } from '@/lib/db/schema/candidate'
import { teams, teamMembers } from '@/lib/db/schema/core'

export async function startQuizAction(formData: FormData) {
  const user = await requireAuth(['candidate'])

  /* ------------------------------------------------------------------ */
  /*                           Payload parse                            */
  /* ------------------------------------------------------------------ */
  const quizId = formData.get('quizId')
  const answer = formData.get('answer')
  const seed = formData.get('seed') as string | null

  if (!quizId || !answer) return { score: 0, message: 'Invalid request.' }
  if (!seed || !/^0x[0-9a-fA-F]{1,64}$/.test(seed)) return { score: 0, message: 'Invalid seed.' }

  /* ------------------------------------------------------------------ */
  /*                     Candidate profile ensure                       */
  /* ------------------------------------------------------------------ */
  let [candidateRow] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candidateRow) {
    const [created] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
    candidateRow = created
  }

  /* ------------------------------------------------------------------ */
  /*                           Team DID check                           */
  /* ------------------------------------------------------------------ */
  const [teamRow] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  const subjectDid = teamRow?.did ?? null
  if (!subjectDid) return { score: 0, message: 'Please create your team DID before taking a quiz.' }

  /* ------------------------------------------------------------------ */
  /*                           Quiz lookup                              */
  /* ------------------------------------------------------------------ */
  const [quiz] = await db
    .select()
    .from(skillQuizzes)
    .where(eq(skillQuizzes.id, Number(quizId)))
    .limit(1)
  if (!quiz) return { score: 0, message: 'Quiz not found.' }

  /* ------------------------------------------------------------------ */
  /*                          AI assessment                             */
  /* ------------------------------------------------------------------ */
  const { aiScore } = await openAIAssess(String(answer), quiz.title)
  const passed = aiScore >= 70

  let message = `You scored ${aiScore}. ${passed ? 'You passed!' : 'You failed.'}`

  let proofJwt = ''
  let vcJson = ''

  if (passed) {
    try {
      const tokenRow = await getVeridaToken(user.id)
      const scopes = tokenRow?.scopes ?? []

      const credential = await issueCredential({
        issuerDid: PLATFORM_ISSUER_DID,
        subjectDid,
        attributes: {
          skillQuiz: quiz.title,
          score: aiScore,
          candidateName: user.name || user.email,
          ...(scopes.length ? { veridaScopes: scopes.join(' ') } : {}),
        },
        credentialName: 'SkillPass',
      })
      vcJson = JSON.stringify(credential)
      proofJwt = credential?.proof?.jwt ?? ''
      message += ' Your Skill Pass credential has been issued!'
    } catch (err) {
      console.error('Credential issuance failed:', err)
      message += ' However, issuing your credential failed. Please try again later.'
    }
  }

  return {
    score: aiScore,
    message,
    passed,
    proofJwt,
    vcJson,
    quizId: quiz.id,
    seed,
  }
}