'use client'

import { useCallback, useState } from 'react'
import { searchUniversal } from '@/lib/verida/client'

type SearchState<T = any> = {
  loading: boolean
  results: T[]
  error: string | null
}

/**
 * React hook wrapping Verida Universal Search for convenient client usage.
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
    try {
      const data = await searchUniversal(keywords)
      const items = (data.items as T[]) ?? (data.results as T[]) ?? []
      setState({ loading: false, results: items, error: null })
    } catch (err: any) {
      setState({ loading: false, results: [], error: err?.message ?? 'Unknown error' })
    }
  }, [])

  return { ...state, search }
}