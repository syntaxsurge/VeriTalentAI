'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'

import { CircleIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionState } from '@/lib/auth/middleware'

import { signIn, signUp } from './actions'

type Role = 'candidate' | 'recruiter' | 'issuer'
interface LoginProps {
  mode?: 'signin' | 'signup'
  fixedRole?: Role
}

export function Login({ mode = 'signin', fixedRole }: LoginProps) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const priceId = searchParams.get('priceId')
  const inviteId = searchParams.get('inviteId')
  const roleFromQuery = searchParams.get('role') as Role | null

  const role = fixedRole ?? roleFromQuery ?? undefined

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  )

  /* -------------------------------- Helpers ------------------------------- */
  function buildSwapLink() {
    const base = mode === 'signin' ? '/sign-up' : '/sign-in'
    const qp = new URLSearchParams()
    if (redirect) qp.set('redirect', redirect)
    if (priceId) qp.set('priceId', priceId)
    if (role) qp.set('role', role)
    return `${base}?${qp.toString()}`
  }

  const heading = mode === 'signin' ? 'Sign in to your account' : 'Create your account'

  /* --------------------------------- JSX ---------------------------------- */
  return (
    <div className='bg-background relative flex min-h-[100dvh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent' />

      <Card className='w-full max-w-md shadow-xl'>
        <CardHeader className='space-y-3 text-center'>
          <div className='flex justify-center'>
            <CircleIcon className='h-12 w-12 text-orange-500' />
          </div>
          <CardTitle className='text-foreground text-2xl font-extrabold sm:text-3xl'>
            {heading}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form className='space-y-6' action={formAction}>
            <input type='hidden' name='redirect' value={redirect || ''} />
            <input type='hidden' name='priceId' value={priceId || ''} />
            <input type='hidden' name='inviteId' value={inviteId || ''} />

            {mode === 'signup' && (
              <div>
                <Label htmlFor='role'>I am signing up as</Label>
                <select
                  id='role'
                  name='role'
                  defaultValue={role || 'candidate'}
                  className='border-border bg-background focus:border-primary mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none'
                >
                  <option value='candidate'>Candidate</option>
                  <option value='recruiter'>Recruiter / Employer</option>
                  <option value='issuer'>Issuer (University / Employer)</option>
                </select>
              </div>
            )}

            <div>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                defaultValue={state.email}
                required
                maxLength={50}
                placeholder='Enter your email'
                className='mt-1'
              />
            </div>

            <div>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                placeholder='Enter your password'
                className='mt-1'
              />
            </div>

            {state?.error && <p className='text-destructive text-sm'>{state.error}</p>}

            <Button
              type='submit'
              className='flex w-full items-center justify-center rounded-full'
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Loading…
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </form>

          <div className='mt-8 text-center text-sm'>
            {mode === 'signin' ? (
              <>
                New to our platform?{' '}
                <Link
                  href={buildSwapLink()}
                  className='text-primary font-medium underline-offset-4 hover:underline'
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  href={buildSwapLink()}
                  className='text-primary font-medium underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
