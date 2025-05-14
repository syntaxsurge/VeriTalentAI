import { getEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                       E N V I R O N M E N T   C O N F I G                  */
/* -------------------------------------------------------------------------- */

export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY') as string

export const CHEQD_API_URL = getEnv('CHEQD_API_URL') as string
export const CHEQD_API_KEY = getEnv('CHEQD_API_KEY') as string

export const PLATFORM_ISSUER_DID = getEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID') as string
