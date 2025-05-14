import assert from 'node:assert/strict'

import * as verida from '@/lib/verida'

/* -------------------------------------------------------------------------- */
/*                           S T U B   V E R I D A                             */
/* -------------------------------------------------------------------------- */

/**
 * Override `searchUniversal` before importing the OpenAI helpers so that
 * `buildProfileContext()` receives predictable data without making a network
 * request.
 */
;(verida as any).searchUniversal = async () => {
  const dummy = Array.from({ length: 200 }, () => ({ foo: 'bar' }))
  return { items: dummy }
}

/* -------------------------------------------------------------------------- */
/*                         I M P O R T   A F T E R                             */
/* -------------------------------------------------------------------------- */

const { buildProfileContext } = await import('@/lib/ai/openai')

/* -------------------------------------------------------------------------- */
/*                            A S S E R T I O N S                              */
/* -------------------------------------------------------------------------- */

const ctx = await buildProfileContext(42)

/* The stub data should survive JSON-stringify and truncation to ≤1000 chars */
assert.ok(ctx.includes('foo'), 'Profile context should include serialized stub payload')

assert.ok(ctx.length <= 1000, 'Profile context must be truncated to a maximum of 1000 characters')
