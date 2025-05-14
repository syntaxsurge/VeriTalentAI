/* -------------------------------------------------------------------------- */
/*                           T E L E G R A M   T Y P E S                      */
/* -------------------------------------------------------------------------- */

/**
 * Minimal representation of a Telegram chat group as stored in Verida.
 * The schema varies, so only common fields are declared explicitly and
 * additional properties are permitted via an index signature.
 */
export interface TelegramGroup {
  /** Primary identifier (fallback from various schema keys). */
  groupId?: string
  /** Human-readable name or title for the chat group. */
  groupName?: string
  /** Generic identifier variants. */
  id?: string
  name?: string
  title?: string
  /** Catch-all for extra fields returned by the datastore. */
  [key: string]: unknown
}

/**
 * Minimal representation of a Telegram chat message as stored in Verida.
 * Only frequently-used fields are typed; callers should guard others.
 */
export interface TelegramMessage {
  /** Message content in plain text form. */
  messageText?: string
  message?: string
  text?: string
  /** Epoch timestamp (seconds) of when the message was sent. */
  date?: number
  timestamp?: number
  /** Sender details. */
  fromName?: string
  sender?: string
  from?: string
  /** Identifier variants. */
  id?: string
  message_id?: string
  /** Catch-all for additional dynamic fields. */
  [key: string]: unknown
}

/** Keyword-to-occurrence count mapping returned by /api/telegram/stats. */
export interface KeywordStats {
  [keyword: string]: number
}