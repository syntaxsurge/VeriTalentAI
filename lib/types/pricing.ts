/**
 * Shared typings for subscription plans used across UI and server code.
 */

/** Canonical plan identifiers */
export type PlanKey = 'free' | 'base' | 'plus'

/**
 * Metadata schema for each subscription tier.
 * Stripe provides actual pricing; this interface now focuses on display data
 * and feature lists persisted in the database.
 */
export interface PlanMeta {
  /** Unique machine-readable key */
  key: PlanKey
  /** Marketing display name */
  name: string
  /** Feature bullet list */
  features: string[]
  /** Optional flag to visually highlight the tier */
  highlight?: boolean
}
