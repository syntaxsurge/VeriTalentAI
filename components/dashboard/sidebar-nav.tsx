'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** A single entry in the sidebar */
export interface SidebarNavItem {
  href: string
  icon: LucideIcon
  label: string
}

/**
 * SidebarNav — renders a vertical list of navigation buttons that
 * highlight based on the current pathname (prefix‑match).
 *
 * Optional `className` lets callers fine‑tune the wrapper padding so
 * multiple SidebarNav blocks can stack seamlessly.
 */
export function SidebarNav({ items, className }: { items: SidebarNavItem[]; className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn(className)}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={active ? 'secondary' : 'ghost'}
              className={cn(
                'my-1 w-full justify-start shadow-none',
                active && 'bg-secondary text-secondary-foreground',
              )}
            >
              <item.icon className='mr-2 h-4 w-4' />
              {item.label}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
