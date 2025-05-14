'use server'

import { CHEQD_API_KEY, CHEQD_API_URL } from './config'

/* -------------------------------------------------------------------------- */
/*                            D I D   C R E A T I O N                         */
/* -------------------------------------------------------------------------- */

/**
 * Create a new did:cheqd identifier on the specified network (defaults to
 * testnet). Returns the DID string on success.
 */
export async function createCheqdDID(
  network: 'testnet' | 'mainnet' = 'testnet',
): Promise<{ did: string }> {
  if (!CHEQD_API_URL || !CHEQD_API_URL.startsWith('http')) {
    throw new Error('CHEQD_API_URL is missing or invalid.')
  }
  if (!CHEQD_API_KEY) {
    throw new Error('CHEQD_API_KEY is not configured')
  }

  /* Body per cheqd Studio API spec */
  const formData = new URLSearchParams({
    network,
    identifierFormatType: 'uuid',
    verificationMethodType: 'Ed25519VerificationKey2018',
    service:
      '[{"idFragment":"service-1","type":"LinkedDomains","serviceEndpoint":["https://example.com"]}]',
    '@context': '["https://www.w3.org/ns/did/v1"]',
  })

  const res = await fetch(`${CHEQD_API_URL}/did/create`, {
    method: 'POST',
    headers: {
      'x-api-key': CHEQD_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    cache: 'no-store',
  })

  console.log(`Create DID Response: ${res}`)

  if (!res.ok) {
    throw new Error(`createCheqdDID failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  if (!data.did) {
    throw new Error("No 'did' returned from cheqd create endpoint.")
  }
  return { did: data.did }
}

/* -------------------------------------------------------------------------- */
/*                     V E R I F I A B L E   C R E D E N T I A L S            */
/* -------------------------------------------------------------------------- */

/**
 * Issue a VC using cheqd Studio.
 */
export async function issueCredential(params: {
  issuerDid: string
  subjectDid: string
  attributes: Record<string, string | number>
  credentialName: string
  statusListName?: string
}): Promise<any> {
  const { issuerDid, subjectDid, attributes, credentialName, statusListName } = params

  if (!CHEQD_API_URL || !CHEQD_API_URL.startsWith('http')) {
    throw new Error('CHEQD_API_URL is missing or invalid.')
  }
  if (!CHEQD_API_KEY) {
    throw new Error('CHEQD_API_KEY is not configured')
  }

  const attrString = JSON.stringify(attributes)
  const formData = new URLSearchParams()
  formData.append('issuerDid', issuerDid)
  formData.append('subjectDid', subjectDid)
  formData.append('attributes', attrString)
  formData.append('format', 'VC-JWT')
  formData.append('type', JSON.stringify([credentialName]))

  if (statusListName) {
    formData.append(
      'credentialStatus',
      JSON.stringify({ statusPurpose: 'revocation', statusListName }),
    )
  }

  const res = await fetch(`${CHEQD_API_URL}/credential/issue`, {
    method: 'POST',
    headers: {
      'x-api-key': CHEQD_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`issueCredential failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Verify a VC using cheqd Studio.
 */
export async function verifyCredential(vcJwtOrObj: unknown): Promise<{ verified: boolean }> {
  /* ------------------------ Basic guardrails -------------------------- */
  if (!CHEQD_API_URL || !CHEQD_API_URL.startsWith('http') || !CHEQD_API_KEY) {
    return { verified: false }
  }

  /* -------------------------------------------------------------------- */
  /*                  Detect input type & extract credential              */
  /* -------------------------------------------------------------------- */
  function extractJwt(obj: any): string | null {
    if (obj && typeof obj === 'object' && typeof (obj as any)?.proof?.jwt === 'string') {
      return (obj as any).proof.jwt
    }
    return null
  }

  let credential: string

  /* String input -------------------------------------------------------- */
  if (typeof vcJwtOrObj === 'string') {
    const trimmed = vcJwtOrObj.trim()

    // Treat as JSON if it looks like an object literal
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        const jwt = extractJwt(parsed)
        credential = jwt ?? JSON.stringify(parsed)
      } catch {
        // Fallback – assume raw JWT string
        credential = trimmed
      }
    } else {
      // Raw JWT
      credential = trimmed
    }
  } else {
    // Non-string input – expect an object
    const jwt = extractJwt(vcJwtOrObj)
    credential = jwt ?? JSON.stringify(vcJwtOrObj)
  }

  /* -------------------------- API request ----------------------------- */
  const formData = new URLSearchParams()
  formData.append('credential', credential)
  formData.append('policies', JSON.stringify({}))

  const res = await fetch(`${CHEQD_API_URL}/credential/verify?verifyStatus=false`, {
    method: 'POST',
    headers: {
      'x-api-key': CHEQD_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    cache: 'no-store',
  })

  if (!res.ok) return { verified: false }
  const data = await res.json()
  return { verified: data.verified === true }
}

/* -------------------------------------------------------------------------- */
/*                         D I D   R E S O L U T I O N                        */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a did:cheqd identifier and return the DID Document if found.
 */
export async function resolveDid(
  did: string,
): Promise<{ found: boolean; document?: Record<string, any> }> {
  if (!CHEQD_API_URL || !CHEQD_API_KEY) {
    return { found: false }
  }

  try {
    const res = await fetch(`${CHEQD_API_URL}/did/search/${encodeURIComponent(did)}`, {
      headers: {
        'x-api-key': CHEQD_API_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (res.status === 404) return { found: false }
    if (!res.ok) return { found: false }

    const doc = await res.json()
    return { found: true, document: doc }
  } catch (error) {
    console.error('resolveDid error:', error)
    return { found: false }
  }
}
