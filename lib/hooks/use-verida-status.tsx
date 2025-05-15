'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* -------------------------------------------------------------------------- */
/*                         V E R I D A   S T A T U S   H O O K                */
/* -------------------------------------------------------------------------- */

type Status = {
  connected: boolean
  providers: string[]
}

/**
 * Retrieve and cache the Verida connection status for a user.
 *
 * @param userId   Platform user ID whose status should be fetched.
 * @param enabled  Optional flag to skip fetching (default <code>true</code>).
 * @returns        { connected, providers, loading, error, refresh }.
 */
export function useVeridaStatus(
  userId?: number,
  enabled = true,
): Status & { loading: boolean; error: string | null; refresh: () => void } {
  const [state, setState] = useState<Status>({
    connected: false,
    providers: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Timestamp ref for simple SWR style invalidation */
  const lastFetched = useRef(0)

  const fetchStatus = useCallback(async () => {
    if (!enabled || !userId) return
    /* Prevent duplicate fetches within the 60 s window */
    if (Date.now() - lastFetched.current < 60_000) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/verida/status?userId=${userId}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      setState({
        connected: !!json.connected,
        providers: Array.isArray(json.providers) ? json.providers : [],
      })
      lastFetched.current = Date.now()
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [userId, enabled])

  /* Initial fetch + 60 s interval revalidation */
  useEffect(() => {
    fetchStatus()
    if (!enabled || !userId) return
    const id = setInterval(fetchStatus, 60_000)
    return () => clearInterval(id)
  }, [fetchStatus, userId, enabled])

  return { ...state, loading, error, refresh: fetchStatus }
}