import { NextRequest, NextResponse } from 'next/server'

/* -------------------------------------------------------------------------- */
/*                           A P I   U T I L I T I E S                        */
/* -------------------------------------------------------------------------- */

/**
 * Parse and validate a <code>userId</code> query parameter from the request URL.
 *
 * @returns Positive integer userId or <code>null</code> when missing/invalid.
 */
export function parseUserId(request: NextRequest): number | null {
  const id = Number(new URL(request.url).searchParams.get('userId'))
  return Number.isFinite(id) && id > 0 ? id : null
}

/**
 * Convenience helper for error JSON responses.
 *
 * @param message Error text.
 * @param status  HTTP status code (defaults to <code>400</code>).
 */
export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status })
}
