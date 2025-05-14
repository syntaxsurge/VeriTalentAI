import { getEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                       E N V I R O N M E N T   C O N F I G                  */
/* -------------------------------------------------------------------------- */

export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY') as string

export const CHEQD_API_URL = getEnv('CHEQD_API_URL') as string
export const CHEQD_API_KEY = getEnv('CHEQD_API_KEY') as string

export const PLATFORM_ISSUER_DID = getEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID') as string

/* --------------------------- Verida --------------------------- */

export const VERIDA_API_URL = getEnv('VERIDA_API_URL') as string
export const VERIDA_API_VERSION = getEnv('VERIDA_API_VERSION') as string
export const VERIDA_DEFAULT_SCOPES = (getEnv('NEXT_PUBLIC_VERIDA_DEFAULT_SCOPES') as string).split(
  ',',
)
export const VERIDA_APP_DID = getEnv('VERIDA_APP_DID') as string
export const VERIDA_APP_REDIRECT_URL = getEnv('NEXT_PUBLIC_VERIDA_APP_REDIRECT_URL') as string