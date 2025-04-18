import { relations } from 'drizzle-orm'
import { pgTable, serial, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core'

import { users } from './core'
import { candidateCredentials } from './veritalent'

/** Statuses an issuer can be in throughout onboarding / review */
export enum IssuerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
}

/**
 * Directory of trusted organisations that can sign credentials.
 * Each row is owned by a platform user (ownerUserId).
 */
export const issuers = pgTable('issuers', {
  id: serial('id').primaryKey(),
  /** Platform user that controls this issuer organisation */
  ownerUserId: integer('owner_user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 200 }).notNull(),
  logoUrl: text('logo_url'),
  /** cheqd DID for issuing VCs (optional until linked) */
  did: text('did').unique(),
  /** `pending` → manual review, `active` → can sign, `rejected` → blocked */
  status: varchar('status', { length: 20 }).notNull().default(IssuerStatus.PENDING),
  /** Domain used for automated email‑domain verification */
  domain: varchar('domain', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const issuersRelations = relations(issuers, ({ one, many }) => ({
  owner: one(users, {
    fields: [issuers.ownerUserId],
    references: [users.id],
  }),
  credentials: many(candidateCredentials),
}))

export type Issuer = typeof issuers.$inferSelect
export type NewIssuer = typeof issuers.$inferInsert
