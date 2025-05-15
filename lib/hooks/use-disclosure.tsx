'use client'

import { useCallback, useState } from 'react'

/* -------------------------------------------------------------------------- */
/*                       u s e D i s c l o s u r e   H o o k                  */
/* -------------------------------------------------------------------------- */

/**
 * Lightweight disclosure helper inspired by Chakra’s API.
 *
 * @param initial Default open state (default <code>false</code>).
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((o) => !o), [])
  const onOpenChange = useCallback((open: boolean) => setIsOpen(open), [])

  return { isOpen, open, close, toggle, onOpenChange }
}
