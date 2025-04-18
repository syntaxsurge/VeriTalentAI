'use client'

import * as React from 'react'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { startQuizAction } from './actions'

export default function StartQuizForm({ quiz }: { quiz: { id: number; title: string } }) {
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = React.useState<number | null>(null)
  const [message, setMessage] = React.useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await startQuizAction(fd)
      if (res) {
        setScore(res.score)
        setMessage(res.message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className='space-y-3'>
      <input type='hidden' name='quizId' value={quiz.id} />
      <div>
        <label htmlFor='answer' className='block text-sm font-medium'>
          Your Answer
        </label>
        <textarea
          id='answer'
          name='answer'
          rows={5}
          className='border-border mt-1 w-full rounded border p-2'
          required
        />
      </div>
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Submitting…' : 'Submit'}
      </Button>
      {score !== null && (
        <div className='mt-2'>
          <p className='font-medium'>AI Score: {score}</p>
          <p>{message}</p>
        </div>
      )}
    </form>
  )
}
