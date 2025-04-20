import { relations } from 'drizzle-orm'
import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  uniqueIndex,
  text,
  boolean,
} from 'drizzle-orm/pg-core'

import { users } from './core'
import { issuers } from './issuer'

/* -------------------------------------------------------------------------- */
/*                              C A N D I D A T E S                            */
/* -------------------------------------------------------------------------- */

export const candidates = pgTable(
  'candidates',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    bio: text('bio'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('candidates_user_id_idx').on(table.userId),
  }),
)

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  user: one(users, {
    fields: [candidates.userId],
    references: [users.id],
  }),
  credentials: many(candidateCredentials),
  quizAttempts: many(quizAttempts),
}))

/* -------------------------------------------------------------------------- */
/*                       C A N D I D A T E   C R E D E N T I A L S             */
/* -------------------------------------------------------------------------- */

/** Credential verification status */
export enum CredentialStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export const candidateCredentials = pgTable('candidate_credentials', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id')
    .notNull()
    .references(() => candidates.id),
  /** FK → issuers.id (university, past employer, etc.)  */
  issuerId: integer('issuer_id').references(() => issuers.id),
  title: varchar('title', { length: 200 }).notNull(),
  /** e.g. diploma, cert, job_ref */
  type: varchar('type', { length: 50 }).notNull(),
  fileUrl: text('file_url'),
  status: varchar('status', { length: 20 }).notNull().default(CredentialStatus.UNVERIFIED),
  verified: boolean('verified').notNull().default(false),
  vcIssuedId: text('vc_issued_id'),
  issuedAt: timestamp('issued_at'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const candidateCredentialsRelations = relations(candidateCredentials, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateCredentials.candidateId],
    references: [candidates.id],
  }),
  issuer: one(issuers, {
    fields: [candidateCredentials.issuerId],
    references: [issuers.id],
  }),
}))

/* -------------------------------------------------------------------------- */
/*                         A I   S K I L L   Q U I Z Z E S                     */
/* -------------------------------------------------------------------------- */

export const skillQuizzes = pgTable('skill_quizzes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').notNull(),
  quizId: integer('quiz_id').notNull(),
  score: integer('score'),
  maxScore: integer('max_score').default(100),
  pass: integer('pass').default(0),
  vcIssuedId: text('vc_issued_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  candidate: one(candidates, {
    fields: [quizAttempts.candidateId],
    references: [candidates.id],
  }),
  quiz: one(skillQuizzes, {
    fields: [quizAttempts.quizId],
    references: [skillQuizzes.id],
  }),
}))

/* -------------------------------------------------------------------------- */
/*                               T Y P E   E X P O R T S                       */
/* -------------------------------------------------------------------------- */

export type Candidate = typeof candidates.$inferSelect
export type NewCandidate = typeof candidates.$inferInsert

export type CandidateCredential = typeof candidateCredentials.$inferSelect
export type NewCandidateCredential = typeof candidateCredentials.$inferInsert

export type SkillQuiz = typeof skillQuizzes.$inferSelect
export type NewSkillQuiz = typeof skillQuizzes.$inferInsert

export type QuizAttempt = typeof quizAttempts.$inferSelect
export type NewQuizAttempt = typeof quizAttempts.$inferInsert
