'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'

import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { QuizMeta } from '@/lib/types/components'
import { copyToClipboard } from '@/lib/utils'

import { startQuizAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                     Deterministic seed-based shuffle                       */
/* -------------------------------------------------------------------------- */
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], seedHex: string): T[] {
  const out = [...arr]
  const seedInt = Number.parseInt(seedHex.slice(2, 10), 16) || 1
  const rand = mulberry32(seedInt)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                          Random seed generator                             */
/* -------------------------------------------------------------------------- */
function randomSeed(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  )
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */
export default function StartQuizForm({ quiz }: { quiz: QuizMeta }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  /* Quiz state --------------------------------------------------------- */
  const [seed, setSeed] = useState<string>('')
  const [question, setQuestion] = useState<{ id: number; prompt: string } | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [proofJwt, setProofJwt] = useState<string>('')
  const [vcJson, setVcJson] = useState<string>('')

  /* -------------------------------------------------------------------- */
  /*         Generate local RNG seed & deterministic question order       */
  /* -------------------------------------------------------------------- */
  React.useEffect(() => {
    if (!open) return

    setSeed('')
    setQuestion(null)
    setScore(null)
    setMessage('')
    setProofJwt('')
    setVcJson('')

    const s = randomSeed()
    setSeed(s)

    const shuffled = shuffle(quiz.questions, s)
    setQuestion(shuffled[0] || null)
  }, [open, quiz.questions])

  /* -------------------------------------------------------------------- */
  /*                          Submit quiz answer                          */
  /* -------------------------------------------------------------------- */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const toastId = toast.loading('Submitting your answer…')

    startTransition(async () => {
      try {
        const res: any = await startQuizAction(fd)
        if (!res) throw new Error('No response')

        setScore(res.score)
        setMessage(res.message)
        toast.success(res.message, { id: toastId })

        if (res.passed && res.proofJwt) {
          setProofJwt(res.proofJwt)
          if (res.vcJson) setVcJson(res.vcJson)

          /* Persist quiz attempt ----------------------------------------- */
          await fetch('/api/skill-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: quiz.id,
              score: res.score,
              seed,
              proofJwt: res.proofJwt,
              vcJson: res.vcJson,
            }),
          })
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
      }
    })
  }

  /* -------------------------------------------------------------------- */
  /*                                UI                                    */
  /* -------------------------------------------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full'>Take Quiz</Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          {quiz.description && (
            <DialogDescription className='line-clamp-3'>{quiz.description}</DialogDescription>
          )}
        </DialogHeader>

        {score === null ? (
          /* ----------------------- Quiz form ------------------------------ */
          <form onSubmit={handleSubmit} className='space-y-4'>
            <input type='hidden' name='quizId' value={quiz.id} />
            <input type='hidden' name='seed' value={seed} />
            {question && <input type='hidden' name='questionId' value={question.id} />}

            {question ? (
              <p className='font-medium'>{question.prompt}</p>
            ) : (
              <p className='text-muted-foreground'>Loading question…</p>
            )}

            <div>
              <label htmlFor={`answer-${quiz.id}`} className='mb-1 block text-sm font-medium'>
                Your Answer
              </label>
              <textarea
                id={`answer-${quiz.id}`}
                name='answer'
                rows={6}
                required
                className='border-border focus-visible:ring-primary w-full rounded-md border p-2 text-sm focus-visible:ring-2'
                placeholder='Type your answer here…'
              />
            </div>

            <Button type='submit' disabled={isPending || !seed || !question} className='w-max'>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Submitting…
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </form>
        ) : (
          /* ---------------------- Result panel ---------------------------- */
          <div className='flex flex-col items-center gap-4 py-6'>
            <p className='text-primary text-4xl font-extrabold'>{score}</p>
            <p className='text-center'>{message}</p>

            {/* VC JWT copy button */}
            {proofJwt && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(proofJwt)}
                className='inline-flex items-center gap-2'
              >
                <Copy className='h-4 w-4' />
                Copy VC JWT
              </Button>
            )}

            {/* VC JSON copy button */}
            {vcJson && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(vcJson)}
                className='inline-flex items-center gap-2'
              >
                <Copy className='h-4 w-4' />
                Copy VC JSON
              </Button>
            )}

            <Button variant='outline' onClick={() => setScore(null)}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
