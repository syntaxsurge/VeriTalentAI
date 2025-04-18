'use server'

const CHEQD_API_URL = process.env.CHEQD_API_URL || 'https://studio.cheqd.io'
const CHEQD_API_KEY = process.env.CHEQD_API_KEY || ''

export async function createCheqdDID(): Promise<{ did: string }> {
  // Check environment first
  if (!CHEQD_API_URL || !CHEQD_API_URL.startsWith('http')) {
    console.error('Invalid CHEQD_API_URL environment variable:', CHEQD_API_URL)
    throw new Error('CHEQD_API_URL is missing or invalid.')
  }
  if (!CHEQD_API_KEY) {
    console.error('CHEQD_API_KEY is not configured')
    throw new Error('CHEQD_API_KEY is not configured')
  }

  // Build request body based on recommended parameters from cheqd docs
  const formData = new URLSearchParams({
    network: 'testnet',
    identifierFormatType: 'uuid',
    verificationMethodType: 'Ed25519VerificationKey2018',
    service:
      '[{"idFragment":"service-1","type":"LinkedDomains","serviceEndpoint":["https://example.com"]}]',
    '@context': '["https://www.w3.org/ns/did/v1"]',
  })

  try {
    const res = await fetch(`${CHEQD_API_URL}/did/create`, {
      method: 'POST',
      headers: {
        'x-api-key': CHEQD_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`createCheqdDID failed: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    if (!data.did) {
      throw new Error("No 'did' returned from cheqd create endpoint.")
    }

    return { did: data.did }
  } catch (error) {
    console.error('Network or config error when calling cheqd DID creation:', error)
    throw new Error(`createCheqdDID: ${String(error)}`)
  }
}

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
    console.error('Invalid CHEQD_API_URL environment variable:', CHEQD_API_URL)
    throw new Error('CHEQD_API_URL is missing or invalid.')
  }
  if (!CHEQD_API_KEY) {
    console.error('CHEQD_API_KEY is not configured')
    throw new Error('CHEQD_API_KEY is not configured')
  }

  const attrString = JSON.stringify(attributes)
  const formData = new URLSearchParams()
  formData.append('issuerDid', issuerDid)
  formData.append('subjectDid', subjectDid)
  formData.append('attributes', attrString)
  formData.append('format', 'jwt')
  formData.append('type', credentialName)

  if (statusListName) {
    formData.append(
      'credentialStatus',
      JSON.stringify({ statusPurpose: 'revocation', statusListName }),
    )
  }

  try {
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

    return await res.json()
  } catch (error) {
    console.error('Network or config error when issuing credential:', error)
    throw new Error(`issueCredential: ${String(error)}`)
  }
}

/**
 * Verify a VC using cheqd Studio.
 */
export async function verifyCredential(vcJwtOrObj: any): Promise<{ verified: boolean }> {
  if (!CHEQD_API_URL || !CHEQD_API_URL.startsWith('http')) {
    console.error('Invalid CHEQD_API_URL environment variable:', CHEQD_API_URL)
    return { verified: false }
  }
  if (!CHEQD_API_KEY) {
    console.error('CHEQD_API_KEY is not configured')
    return { verified: false }
  }

  const formData = new URLSearchParams()
  formData.append('credential', JSON.stringify(vcJwtOrObj))
  formData.append('policies', JSON.stringify({}))

  try {
    const res = await fetch(`${CHEQD_API_URL}/credential/verify?verifyStatus=false`, {
      method: 'POST',
      headers: {
        'x-api-key': CHEQD_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('verifyCredential fetch failed:', res.status, res.statusText)
      return { verified: false }
    }

    const data = await res.json()
    return { verified: data.verified === true }
  } catch (error) {
    console.error('Network or config error when verifying credential:', error)
    return { verified: false }
  }
}
