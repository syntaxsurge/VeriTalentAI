'use client'

import { useCallback, useState } from 'react'

import { searchUniversal } from '@/lib/verida/client'

type SearchState<T = any> = {
  loading: boolean
  results: T[]
  error: string | null
}

/* -------------------------------------------------------------------------- */
/*                         L O C A L   T O K E N   H E L P E R                */
/* -------------------------------------------------------------------------- */

/**
 * Ensure the Verida auth_token is present in localStorage by requesting it
 * from the new /api/verida/token endpoint when absent.
 *
 * @returns true when a token is now available, false otherwise.
 */
async function ensureLocalAuthToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (window.localStorage.getItem('verida_auth_token')) return true

  try {
    const res = await fetch('/api/verida/token', { cache: 'no-store' })
    if (!res.ok) return false
    const json = await res.json()
    if (json?.token) {
      window.localStorage.setItem('verida_auth_token', json.token as string)
      return true
    }
  } catch {
    /* silent */
  }
  return false
}

/* -------------------------------------------------------------------------- */
/*                        U N I V E R S A L   S E A R C H                     */
/* -------------------------------------------------------------------------- */

/**
 * React hook wrapping Verida Universal Search with automatic token recovery.
 */
export function useVeridaSearch<T = any>(): {
  loading: boolean
  results: T[]
  error: string | null
  search: (keywords: string) => Promise<void>
} {
  const [state, setState] = useState<SearchState<T>>({
    loading: false,
    results: [],
    error: null,
  })

  const search = useCallback(async (keywords: string) => {
    if (!keywords) return
    setState((s) => ({ ...s, loading: true, error: null }))

    /* Inner helper so we can retry without duplicating logic */
    const runSearch = async () => {
      const data = await searchUniversal(keywords)
      const items = (data.items as T[]) ?? (data.results as T[]) ?? []
      setState({ loading: false, results: items, error: null })
    }

    try {
      await runSearch()
    } catch (err: any) {
      const msg = err?.message ?? ''
      /* Detect missing browser-session token and attempt automatic recovery */
      if (msg.includes('not connected in this browser')) {
        const ok = await ensureLocalAuthToken()
        if (ok) {
          try {
            await runSearch()
            return
          } catch (retryErr: any) {
            setState({
              loading: false,
              results: [],
              error: retryErr?.message ?? 'Unknown error',
            })
            return
          }
        }
      }

      setState({
        loading: false,
        results: [],
        error: msg || 'Unknown error',
      })
    }
  }, [])

  return { ...state, search }
}
