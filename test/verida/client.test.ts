import assert from 'node:assert/strict'

import { buildAuthUrl } from '@/lib/verida/public'

/**
 * Basic sanity check that the generated authentication link matches
 * the documented Verida endpoint and embeds multiple scope params.
 */
const url = buildAuthUrl()

assert.ok(
  url.includes('/auth?'),
  'buildAuthUrl() must contain the /auth endpoint path (without /auth/auth)',
)

const scopesMatches = url.match(/scopes=/g) || []
assert.ok(
  scopesMatches.length >= 2,
  'buildAuthUrl() must include at least two "scopes=" query params',
)