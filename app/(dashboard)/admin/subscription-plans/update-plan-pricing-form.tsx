'use client'

import * as React from 'react'
import { startTransition } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { updatePlanPricingAction } from './actions'

interface Props {
  defaultPricing: {
    base: number
    plus: number
  }
}

/**
 * Simple two-field form letting an admin set monthly USD pricing for Base & Plus plans.
 */
export default function UpdatePlanPricingForm({ defaultPricing }: Props) {
  const [base, setBase] = React.useState(defaultPricing.base.toString())
  const [plus, setPlus] = React.useState(defaultPricing.plus.toString())

  const [state, action, pending] = React.useActionState<any, FormData>(updatePlanPricingAction, {})

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
    if (state?.success) toast.success(state.success)
  }, [state])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('basePrice', base)
    fd.append('plusPrice', plus)
    startTransition(() => action(fd))
  }

  const inputCls =
    'w-full rounded-md border p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <h3 className='text-lg font-semibold'>Plan Pricing (USD / month)</h3>

      <div className='grid gap-6 sm:grid-cols-2'>
        <div>
          <label htmlFor='basePrice' className='mb-1 block text-sm font-medium'>
            Base Plan
          </label>
          <input
            id='basePrice'
            type='number'
            step='0.01'
            min='1'
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor='plusPrice' className='mb-1 block text-sm font-medium'>
            Plus Plan
          </label>
          <input
            id='plusPrice'
            type='number'
            step='0.01'
            min='1'
            value={plus}
            onChange={(e) => setPlus(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <Button type='submit' className='w-full sm:w-auto' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Updating…
          </>
        ) : (
          'Update Pricing'
        )}
      </Button>
    </form>
  )
}
