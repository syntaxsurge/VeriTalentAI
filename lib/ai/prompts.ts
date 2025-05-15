/**
 * Lightweight message object shape accepted by the OpenAI chat API.
 * (Avoids importing OpenAI types here to prevent circular dependencies.)
 */
export type PromptMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/* -------------------------------------------------------------------------- */
/*                              Q U I Z  G R A D E R                          */
/* -------------------------------------------------------------------------- */

/**
 * Build the message array used by the AI quiz-grader.
 *
 * @param quizTitle Title of the quiz being graded.
 * @param answer    Candidate’s free-text answer.
 */
export function strictGraderMessages(quizTitle: string, answer: string): PromptMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a strict exam grader. Respond ONLY with an integer 0-100.',
    },
    {
      role: 'user',
      content: `Quiz topic: ${quizTitle}\nCandidate answer: ${answer}\nGrade (0-100):`,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                        P R O F I L E   S U M M A R Y                       */
/* -------------------------------------------------------------------------- */

/**
 * Build the message array used to summarise a raw candidate profile.
 *
 * @param profile Raw profile text.
 * @param words   Approximate word budget (default 120).
 */
export function summariseProfileMessages(profile: string, words = 120): PromptMessage[] {
  return [
    {
      role: 'system',
      content:
        `Summarise the following candidate profile in approximately ${words} words. ` +
        `Write in third-person professional tone without using personal pronouns.`,
    },
    {
      role: 'user',
      content: profile,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                R E C R U I T E R   " W H Y   H I R E "  P R O M P T        */
/* -------------------------------------------------------------------------- */

export function candidateFitMessages(pipelines: string, candidateText: string): PromptMessage[] {
  const schema = `{
  "bullets":  [ "string (exactly 12 words)", 5 items ],
  "bestPipeline": "string | NONE",
  "pros":    [ "string", … ],
  "cons":    [ "string", … ]
}`

  return [
    {
      role: 'system',
      content:
        `You are an elite technical recruiter assistant with deep knowledge of skill\n` +
        `match-making, talent branding and concise executive communication.  Follow ALL rules\n` +
        `strictly:\n` +
        `• Think step-by-step but output *only* the final JSON (no markdown, no commentary).\n` +
        `• Each "bullets" item MUST contain exactly 12 words; start with an action verb.\n` +
        `• Use the recruiter’s pipelines to choose "bestPipeline"; if none fit, return "NONE".\n` +
        `• Focus on evidence from credentials/bio; do not invent facts.\n` +
        `• Obey the output schema below verbatim.\n\n` +
        `Output schema:\n${schema}`,
    },
    {
      role: 'user',
      content:
        `=== Recruiter Pipelines (max 20) ===\n${pipelines}\n\n` +
        `=== Candidate Profile ===\n${candidateText}\n\n` +
        `Return the JSON now:`,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                     T E L E G R A M   I N S I G H T S                      */
/* -------------------------------------------------------------------------- */

/**
 * Build messages for the Verida LLM agent to analyse Telegram chats and
 * produce structured insights.
 *
 * Expected **assistant** JSON schema:
 * {
 *   "topTopics": [ "string", … up to 5 ],
 *   "sentiment": "positive" | "neutral" | "negative",
 *   "actionItems": [ "string", … ]
 * }
 *
 * @param transcript Combined Telegram message text (≤ 8 000 chars recommended).
 */
export function telegramInsightsMessages(transcript: string): PromptMessage[] {
  const schema = `{
  "topTopics": [ "string", … max 5 ],
  "sentiment": "positive | neutral | negative",
  "actionItems": [ "string", … ]
}`

  return [
    {
      role: 'system',
      content:
        `You are an expert communications analyst. Analyse the user's recent Telegram\n` +
        `conversations, detect prevalent discussion topics, overall sentiment and any\n` +
        `explicit or implicit action items. Respond **only** with valid JSON conforming\n` +
        `exactly to the following schema:\n${schema}`,
    },
    {
      role: 'user',
      content:
        `Here are the latest Telegram messages (chronological, newest first):\n\n${transcript}\n\n` +
        `Return the JSON now:`,
    },
  ]
}