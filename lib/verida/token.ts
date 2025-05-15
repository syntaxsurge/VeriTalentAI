import { VERIDA_API_URL, VERIDA_API_VERSION } from '@/lib/config'
import { upsertVeridaToken } from '@/lib/db/queries/queries'
import { db } from '@/lib/db/drizzle'
import { veridaConnections } from '@/lib/db/schema/verida'
import { eq } from 'drizzle-orm'

/* -------------------------------------------------------------------------- */
/*                   S C O P E   &   T O K E N   H E L P E R S                */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the list of scopes granted to a Verida auth token.
 */
export async function fetchGrantedScopes(authToken: string): Promise<string[]> {
  try {
    const res = await fetch(`${VERIDA_API_URL}/${VERIDA_API_VERSION}/scopes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.scopes)) return data.scopes
    }
  } catch (err) {
    console.error('Failed to fetch Verida scopes', err)
  }
  return []
}

/**
 * Persist the supplied Verida auth token for the user, storing its granted
 * scopes so we can validate permission requirements later.
 */
export async function storeVeridaToken(userId: number, authToken: string): Promise<void> {
  const scopes = await fetchGrantedScopes(authToken)
  await upsertVeridaToken(userId, authToken, scopes)
}

/* -------------------------------------------------------------------------- */
/*             P R O V I D E R   S N A P S H O T   S Y N C (Section 6)        */
/* -------------------------------------------------------------------------- */

/**
 * Immediately query `/connections/status` using the freshly-issued auth_token
 * and persist a per-provider snapshot in the `verida_connections` table.
 *
 * The table is fully replaced on each sync to keep local state consistent
 * with the user’s current Vault permissions.
 */
export async function syncVeridaConnections(userId: number, authToken: string): Promise<void> {
  try {
    /* -------------------------------------------------------------------- */
    /*                       Fetch authorised provider list                 */
    /* -------------------------------------------------------------------- */
    const res = await fetch(`${VERIDA_API_URL}/${VERIDA_API_VERSION}/connections/status`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(
        `syncVeridaConnections failed for user ${userId}: ${res.status} ${res.statusText}`,
      )
      return
    }

    const json = await res.json()
    const providers = Array.isArray(json?.providers) ? (json.providers as string[]) : []

    /* -------------------------------------------------------------------- */
    /*               Replace existing snapshot rows inside a txn            */
    /* -------------------------------------------------------------------- */
    await db.transaction(async (tx) => {
      await tx.delete(veridaConnections).where(eq(veridaConnections.userId, userId))

      if (providers.length > 0) {
        const now = new Date()
        const rows = providers.map((p) => ({
          userId,
          providerId: p,
          syncStatus: 'ok',
          lastSync: now,
        }))
        await tx.insert(veridaConnections).values(rows)
      }
    })
  } catch (err) {
    console.error('syncVeridaConnections error:', err)
  }
}

/* -------------------------------------------------------------------------- */
/*                               U T I L I T Y                                */
/* -------------------------------------------------------------------------- */

/**
 * Normalise the optional `state` query parameter, defaulting to `/dashboard`.
 */
export function resolveState(stateParam: string | null): string {
  return stateParam && stateParam.trim().length > 0 ? stateParam : '/dashboard'
}