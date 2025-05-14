import type { PlanKey, PlanMeta } from '@/lib/types/pricing'

/**
 * Subscription plan metadata shared by UI and seeders.
 * All billing is handled by Stripe; prices are defined there, so this module
 * concerns itself only with display order and static feature lists.
 */

export const PLAN_KEYS: readonly PlanKey[] = ['free', 'base', 'plus'] as const

/**
 * Immutable feature table.
 * ⚠️  Keep this array **sorted** in display order for the pricing grid.
 */
export const PLAN_META: readonly PlanMeta[] = [
  {
    key: 'free',
    name: 'Free',
    highlight: true,
    features: [
      'Unlimited Credentials',
      'Unlimited Skill Passes',
      'Team Workspace',
      'Basic Email Support',
      'Public Recruiter Profile',
    ],
  },
  {
    key: 'base',
    name: 'Base',
    features: [
      'Everything in Free',
      'Up to 5 Recruiter Seats',
      '50 AI Skill Checks / month',
      '50 Credential Verifications / month',
      'Advanced Talent Search Filters',
      'Exportable Reports',
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    features: [
      'Everything in Base',
      'Unlimited Recruiter Seats',
      'Unlimited Skill Checks & Verifications',
      'Custom Branding & Domain',
      'API Access',
      'Priority Issuer Application Review',
    ],
  },
] as const

/**
 * Helper: return strongly-typed plan metadata for a given key.
 */
export function getPlanMeta(key: PlanKey): PlanMeta {
  const meta = PLAN_META.find((p) => p.key === key)
  if (!meta) throw new Error(`Unknown plan key: ${key}`)
  return meta
}

/* Re-export typings for convenience */
export type { PlanMeta }
