'use server'

import { revalidatePath } from 'next/cache'

import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createCheqdDID } from '@/lib/cheqd'
import { upsertEnv } from '@/lib/utils/env.server'

/* -------------------------------------------------------------------------- */
/*                              V A L I D A T I O N                           */
/* -------------------------------------------------------------------------- */

const schema = z.object({
  /** Optional DID provided by admin; when absent a fresh one is created. */
  did: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^did:cheqd:(testnet|mainnet):[0-9a-zA-Z-]{32,}$/.test(v), {
      message: 'Invalid cheqd DID (expected did:cheqd:testnet:<uuid> or did:cheqd:mainnet:<uuid>).',
    }),
})

/* -------------------------------------------------------------------------- */
/*                                 A C T I O N                                */
/* -------------------------------------------------------------------------- */

export const upsertPlatformDidAction = validatedActionWithUser(
  schema,
  async ({ did }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    let newDid = did?.trim()

    /* Auto-generate when not supplied ----------------------------------- */
    if (!newDid) {
      try {
        const { did: generated } = await createCheqdDID('testnet')
        newDid = generated
      } catch (err: any) {
        return { error: `Failed to create cheqd DID: ${err?.message || String(err)}` }
      }
    }

    /* Persist to environment -------------------------------------------- */
    try {
      await upsertEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID', newDid!)
    } catch (envErr: any) {
      return { error: `Failed to persist DID to environment file: ${String(envErr)}` }
    }

    revalidatePath('/admin/platform-did')
    return { success: 'Platform DID updated.', did: newDid }
  },
)
