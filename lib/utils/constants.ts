import type { VeridaScope } from '@/lib/types'

/**
 * Centralised, type-safe list of Verida scopes requested by the application.
 * Keep in sync with NEXT_PUBLIC_VERIDA_DEFAULT_SCOPES in environment config.
 */
export const VERIDA_SCOPES: VeridaScope[] = [
  'api:search-universal',
  'ds:r:social-email',
  'ds:r:file',
]