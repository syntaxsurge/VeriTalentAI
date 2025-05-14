// noinspection ES6PreferShortImport
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

// Override the server-side Verida fetch helper so that API routes do not
// perform real network calls during test runs.
import * as veridaServer from '@/lib/verida/server'
;(veridaServer as any).veridaFetch = async () => ({ items: [] })

// Import API route handlers after stubbing so they pick up the mock.
import { GET as groupsGET } from '@/app/api/telegram/groups/route'
import { GET as messagesGET } from '@/app/api/telegram/messages/route'

/* -------------------------------------------------------------------------- */
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

function fakeRequest(url: string): NextRequest {
  // The route implementations only access the .url property, so a minimal
  // object cast to NextRequest is sufficient for these smoke tests.
  return { url } as unknown as NextRequest
}

/* -------------------------------------------------------------------------- */
/*                              S M O K E   T E S T S                         */
/* -------------------------------------------------------------------------- */

async function testGroupsEndpoint() {
  const res = await groupsGET(fakeRequest('http://localhost/api/telegram/groups?userId=1'))
  const data = await res.json()

  assert.ok(data.success, 'groups endpoint should return success: true')
  assert.ok(Array.isArray(data.groups), 'groups should be an array')
}

async function testMessagesEndpoint() {
  const res = await messagesGET(fakeRequest('http://localhost/api/telegram/messages?userId=1'))
  const data = await res.json()

  assert.ok(data.success, 'messages endpoint should return success: true')
  assert.ok(Array.isArray(data.messages), 'messages should be an array')
}

await Promise.all([testGroupsEndpoint(), testMessagesEndpoint()])