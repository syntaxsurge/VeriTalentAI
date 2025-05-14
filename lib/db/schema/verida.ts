import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './core'

/* -------------------------------------------------------------------------- */
/*                           V E R I D A   T O K E N S                        */
/* -------------------------------------------------------------------------- */

/**
 * Stores a Verida auth_token issued to a user along with its granted scopes
 * and expiry metadata for transparent refresh / revocation flows.
 */
export const veridaTokens = pgTable('verida_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  authToken: text('auth_token').notNull(),
  /** Array of scope strings granted with this token (eg: api:search-universal). */
  scopes: text('scopes').array().notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

/* -------------------------------------------------------------------------- */
/*                                T Y P E S                                   */
/* -------------------------------------------------------------------------- */

export type VeridaToken = typeof veridaTokens.$inferSelect
export type NewVeridaToken = typeof veridaTokens.$inferInsert