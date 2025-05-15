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
/*                       P E R - P R O V I D E R   S N A P S H O T            */
/* -------------------------------------------------------------------------- */

/**
 * Persist authorised providers and their sync metadata to support
 * offline checks, recruiter filters and audit requirements.
 */
export const veridaConnections = pgTable('verida_connections', {
  id: serial('id').primaryKey(),
  /** Owning platform user. */
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  /** Provider identifier string (e.g. 'telegram', 'gmail'). */
  providerId: text('provider_id').notNull(),
  /** Optional provider-specific account identifier. */
  accountId: text('account_id'),
  /** syncStatus describes the last sync outcome ('ok', 'error', etc.). */
  syncStatus: text('sync_status').notNull().default('ok'),
  /** Timestamp of the most recent successful sync. */
  lastSync: timestamp('last_sync', { withTimezone: true }),
  /** Row creation timestamp for audit purposes. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* -------------------------------------------------------------------------- */
/*                                T Y P E S                                   */
/* -------------------------------------------------------------------------- */

export type VeridaToken = typeof veridaTokens.$inferSelect
export type NewVeridaToken = typeof veridaTokens.$inferInsert

export type VeridaConnection = typeof veridaConnections.$inferSelect
export type NewVeridaConnection = typeof veridaConnections.$inferInsert
