import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { getTeamForUser, getUser } from '@/lib/db/queries/queries'
import { TeamDataWithMembers, User } from '@/lib/db/schema'

export type ActionState = {
  error?: string
  success?: string
  [key: string]: any // This allows for additional properties
}

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
) => Promise<T>

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error.errors[0].message } as T
    }

    return action(result.data, formData)
  }
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User,
) => Promise<T>

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const user = await getUser()
    if (!user) {
      throw new Error('User is not authenticated')
    }

    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error.errors[0].message } as T
    }

    return action(result.data, formData, user)
  }
}

type ActionWithTeamFunction<T> = (formData: FormData, team: TeamDataWithMembers) => Promise<T>

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser()
    if (!user) {
      redirect('/sign-in')
    }

    const team = await getTeamForUser(user.id)
    if (!team) {
      throw new Error('Team not found')
    }

    return action(formData, team)
  }
}

/* -------------------------------------------------------------------------- */
/*                  V E R I D A   A U T H   T O K E N   I N T E R C E P T O R */
/* -------------------------------------------------------------------------- */

/**
 * Middleware helper to capture an `auth_token` query param returned by Verida,
 * stash it in a temporary HTTP-only cookie and redirect to the callback route.
 * Call this from your project-level `middleware.ts`.
 */
export function interceptVeridaAuthToken(request: NextRequest): NextResponse | void {
  const authToken = request.nextUrl.searchParams.get('auth_token')
  if (!authToken) return

  const callbackUrl = new URL('/api/verida/callback', request.url)
  const response = NextResponse.redirect(callbackUrl)

  response.cookies.set({
    name: 'verida_tmp_token',
    value: authToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  })

  return response
}