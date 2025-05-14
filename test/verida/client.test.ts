import assert from 'node:assert/strict'

import { buildAuthUrl } from '@/lib/verida/client'

/**
 * Basic sanity check that the generated authentication link matches
 * the documented Verida endpoint and embeds at least one scope param.
 */
const url = buildAuthUrl()

assert.ok(url.includes('/auth/auth'), 'buildAuthUrl() must contain the auth/auth endpoint path')

assert.ok(url.includes('scopes='), 'buildAuthUrl() must include at least one "scopes=" query param')
