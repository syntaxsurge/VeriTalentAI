'use server'

import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createCheqdDID } from '@/lib/cheqd'

const ENV_PATH = path.resolve(process.cwd(), '.env')

async function upsertEnv(key: string, value: string) {
  let contents = ''
  try {
    contents = await fs.readFile(ENV_PATH, 'utf8')
  } catch {
    /* .env does not exist yet – will create */
  }

  const lines = contents.split('\n')
  const regex = new RegExp(`^${key}=.*$`)
  let found = false

  const newLines = lines.map((ln) => {
    if (regex.test(ln)) {
      found = true
      return `${key}=${value}`
    }
    return ln
  })

  if (!found) newLines.push(`${key}=${value}`)

  await fs.writeFile(ENV_PATH, newLines.join('\n'), 'utf8')
}

export const generatePlatformDidAction = validatedActionWithUser(
  z.object({}),
  async (_data, _form, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    if (process.env.PLATFORM_ISSUER_DID) {
      return { error: 'PLATFORM_ISSUER_DID already exists.' }
    }

    try {
      const { did } = await createCheqdDID()
      await upsertEnv('PLATFORM_ISSUER_DID', did)
      process.env.PLATFORM_ISSUER_DID = did
      return { success: 'Platform DID generated and saved.', did }
    } catch (err: any) {
      return { error: String(err) }
    }
  },
)