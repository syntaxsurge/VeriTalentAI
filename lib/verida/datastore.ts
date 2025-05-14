import 'server-only'

import { veridaFetch } from './server'

/* -------------------------------------------------------------------------- */
/*                         D A T A S T O R E   U T I L S                      */
/* -------------------------------------------------------------------------- */

export const TELEGRAM_GROUP_SCHEMA =
  'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json'
export const TELEGRAM_MESSAGE_SCHEMA =
  'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json'

/** Base64‐encode helper mirroring browser <code>btoa</code> behaviour. */
export function b64(str: string): string {
  return Buffer.from(str).toString('base64')
}

/**
 * Generic datastore query helper returning the <code>items</code> array.
 */
export async function queryDatastore<T = any>(
  userId: number,
  schemaUrl: string,
  query: Record<string, any> = {},
  options: Record<string, any> = {},
): Promise<T[]> {
  const encoded = b64(schemaUrl)
  const res = await veridaFetch<{ items?: T[] }>(userId, `/ds/query/${encoded}`, {
    method: 'POST',
    body: JSON.stringify({ query, options }),
  })
  return Array.isArray(res.items) ? res.items : []
}

/**
 * Convenience wrapper for the <code>/ds/count</code> endpoint.
 */
export async function countDatastore(
  userId: number,
  schemaUrl: string,
  query: Record<string, any> = {},
): Promise<number> {
  const encoded = b64(schemaUrl)
  const res = await veridaFetch<Record<string, any>>(userId, `/ds/count/${encoded}`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
  return typeof res.count === 'number' ? res.count : 0
}

/* -------------------------------------------------------------------------- */
/*                          T E L E G R A M   H E L P E R S                   */
/* -------------------------------------------------------------------------- */

const TELEGRAM_QUERY = { sourceApplication: 'https://telegram.com' }

/** Fetch Telegram chat groups for a user. */
export async function fetchTelegramGroups<T = any>(
  userId: number,
  { limit = 100_000 }: { limit?: number } = {},
): Promise<T[]> {
  return queryDatastore<T>(
    userId,
    TELEGRAM_GROUP_SCHEMA,
    TELEGRAM_QUERY,
    { sort: [{ _id: 'desc' }], limit },
  )
}

/** Fetch Telegram chat messages for a user. */
export async function fetchTelegramMessages<T = any>(
  userId: number,
  { limit = 100_000 }: { limit?: number } = {},
): Promise<T[]> {
  return queryDatastore<T>(
    userId,
    TELEGRAM_MESSAGE_SCHEMA,
    TELEGRAM_QUERY,
    { sort: [{ _id: 'desc' }], limit },
  )
}