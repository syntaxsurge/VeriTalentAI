import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*                                E N U M S                                   */
/* -------------------------------------------------------------------------- */

/** Lifecycle status controlled by the admin panel. */
export const issuerStatusEnum = pgEnum('issuer_status', ['PENDING', 'ACTIVE', 'REJECTED'])
export const IssuerStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
} as const

/** Broad organisation category. */
export const issuerCategoryEnum = pgEnum('issuer_category', [
  'UNIVERSITY',
  'EMPLOYER',
  'TRAINING_PROVIDER',
  'GOVERNMENT',
  'OTHER',
])
export const IssuerCategory = {
  UNIVERSITY: 'UNIVERSITY',
  EMPLOYER: 'EMPLOYER',
  TRAINING_PROVIDER: 'TRAINING_PROVIDER',
  GOVERNMENT: 'GOVERNMENT',
  OTHER: 'OTHER',
} as const

/** Optional industry tag to improve search and filtering. */
export const issuerIndustryEnum = pgEnum('issuer_industry', [
  'TECH',
  'FINANCE',
  'HEALTHCARE',
  'EDUCATION',
  'AUTOMOTIVE',
  'AGRICULTURE',
  'MANUFACTURING',
  'RETAIL',
  'GOVERNMENT',
  'NONPROFIT',
  'OTHER',
])
export const IssuerIndustry = {
  TECH: 'TECH',
  FINANCE: 'FINANCE',
  HEALTHCARE: 'HEALTHCARE',
  EDUCATION: 'EDUCATION',
  AUTOMOTIVE: 'AUTOMOTIVE',
  AGRICULTURE: 'AGRICULTURE',
  MANUFACTURING: 'MANUFACTURING',
  RETAIL: 'RETAIL',
  GOVERNMENT: 'GOVERNMENT',
  NONPROFIT: 'NONPROFIT',
  OTHER: 'OTHER',
} as const

/* -------------------------------------------------------------------------- */
/*                                 T A B L E                                  */
/* -------------------------------------------------------------------------- */

export const issuers = pgTable('issuers', {
  id: serial('id').primaryKey(),
  ownerUserId: integer('owner_user_id').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  did: varchar('did', { length: 255 }),
  status: issuerStatusEnum('status').notNull().default('PENDING'),
  category: issuerCategoryEnum('category').notNull().default('OTHER'),
  industry: issuerIndustryEnum('industry').notNull().default('OTHER'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})