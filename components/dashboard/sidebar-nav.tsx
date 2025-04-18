'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export interface SidebarNavItem {
  href: string
  icon: LucideIcon
  label: string
}

interface SidebarNavProps {
  /** Optional small heading shown above this group */
  title?: string
  items: SidebarNavItem[]
  /** Extra classes for the wrapper */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                            S I D E B A R   N A V                           */
/* -------------------------------------------------------------------------- */

/**
 * Renders a vertical list of navigation buttons, optionally prefixed by
 * a group heading (e.g. “Main”, “Candidate Tools”, “Settings”).
 *
 * Active state is determined by prefix‑matching the current pathname.
 */
export function SidebarNav({ title, items, className }: SidebarNavProps) {
  const pathname = usePathname()

  if (!items.length) return null

  return (
    <nav className={cn('mb-3', className)}>
      {title && (
        <p className='text-sidebar-foreground/70 mb-1 ml-3 mt-4 select-none text-xs font-semibold uppercase tracking-wider'>
          {title}
        </p>
      )}

      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link key={href} href={href}>
            <Button
              variant={active ? 'secondary' : 'ghost'}
              className={cn(
                'my-0.5 w-full justify-start shadow-none',
                active && 'bg-secondary text-secondary-foreground',
              )}
            >
              <Icon className='mr-2 h-4 w-4' />
              {label}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}