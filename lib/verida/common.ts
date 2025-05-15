import { VERIDA_API_URL, VERIDA_API_VERSION } from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                    S H A R E D   V E R I D A   C O N S T A N T S           */
/* -------------------------------------------------------------------------- */

/**
 * Ensure the configured Verida REST root includes the required version segment
 * (e.g. `/v1`) to match the working sample implementation and prevent 404s.
 */
function withVersion(base: string): string {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base
  const version = VERIDA_API_VERSION.startsWith('/')
    ? VERIDA_API_VERSION.slice(1)
    : VERIDA_API_VERSION
  return trimmed.endsWith(`/${version}`) ? trimmed : `${trimmed}/${version}`
}

/** Fully-qualified Verida REST base URL, guaranteed to include `/v{n}`. */
export const VERIDA_BASE_URL: string = withVersion(VERIDA_API_URL)

/**
 * Construct the final Verida REST URL for a given endpoint.
 *
 * @param endpoint Path beginning with `/` or a full URL when {@code raw} is {@code true}.
 * @param raw      Skip base-URL prefixing when {@code true}.
 */
export function buildVeridaUrl(endpoint: string, raw = false): string {
  return raw ? endpoint : `${VERIDA_BASE_URL}${endpoint}`
}

/* -------------------------------------------------------------------------- */
/*                       K N O W N   P R O V I D E R S                        */
/* -------------------------------------------------------------------------- */

/**
 * Canonical list of data providers supported by Verida connectors.
 * Centralising this list avoids magic strings and enables strong typing.
 */
export const KNOWN_PROVIDERS = [
  'google', // Gmail, Calendar, Drive, YouTube
  'telegram',
  'discord',
  'spotify',
  'facebook',
  'notion',
  'slack',
] as const
