'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react'

import { signOut } from '@/app/(auth)/actions'
import { ModeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useUser } from '@/lib/auth'

const LANDING_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'deep-dive', label: 'Deep Dive' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'cta', label: 'Get Started' },
] as const

export default function SiteHeader() {
  const router = useRouter()
  const { userPromise } = useUser()
  const [user, setUser] = useState<Awaited<typeof userPromise> | null>(null)

  useEffect(() => {
    let active = true
    const value: unknown = userPromise
    if (value && typeof value === 'object' && typeof (value as any).then === 'function') {
      ;(value as Promise<any>).then(
        (u) => active && setUser(u),
        () => active && setUser(null),
      )
    } else {
      setUser(value as Awaited<typeof userPromise>)
    }
    return () => {
      active = false
    }
  }, [userPromise])

  async function handleSignOut() {
    await signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <header className='border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b shadow-sm backdrop-blur'>
      <div className='mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 md:px-6'>
        {/* Brand */}
        <Link href='/' className='text-primary flex items-center gap-2 whitespace-nowrap text-lg font-extrabold tracking-tight'>
          <Image src='/images/veritalent-logo.png' alt='VeriTalent logo' width={24} height={24} priority className='h-6 w-auto' />
          VeriTalent AI
        </Link>

        {/* Desktop nav */}
        <nav className='hidden justify-center gap-8 md:flex'>
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Link href='/' className='text-foreground/80 hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors'>
                Home
                <ChevronDown className='mt-0.5 h-3 w-3' />
              </Link>
            </HoverCardTrigger>
            <HoverCardContent side='bottom' align='start' className='w-44 rounded-lg p-2'>
              <ul className='space-y-1'>
                {LANDING_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <Link href={`/#${s.id}`} className='hover:bg-muted block rounded px-2 py-1 text-sm'>
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </HoverCardContent>
          </HoverCard>

          <Link href='/pricing' className='text-foreground/80 hover:text-foreground text-sm font-medium transition-colors'>
            Pricing
          </Link>

          <Link href='/issuers' className='text-foreground/80 hover:text-foreground text-sm font-medium transition-colors'>
            Issuers
          </Link>

          <Link href='/dashboard' className='text-foreground/80 hover:text-foreground text-sm font-medium transition-colors'>
            Dashboard
          </Link>
        </nav>

        {/* Right side */}
        <div className='flex items-center justify-end gap-3'>
          <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className='cursor-pointer'>
                  <AvatarFallback>
                    {(user.name || user.email || 'U')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-60 rounded-lg p-1 shadow-lg'>
                <DropdownMenuItem asChild className='rounded-md p-3 hover:bg-muted'>
                  <Link href='/settings/general' className='flex w-full flex-col items-start'>
                    <span className='font-medium leading-none'>{user.name || user.email}</span>
                    <span className='text-xs text-muted-foreground capitalize'>{user.role}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href='/dashboard'>
                    <LayoutDashboard className='mr-2 h-4 w-4' /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='/settings/team'>
                    <Settings className='mr-2 h-4 w-4' /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={handleSignOut} className='w-full'>
                  <button type='submit' className='flex w-full'>
                    <DropdownMenuItem className='flex-1 cursor-pointer'>
                      <LogOut className='mr-2 h-4 w-4' /> Sign out
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href='/sign-in' className='shrink-0'>
                <Button variant='ghost' size='sm'>Sign in</Button>
              </Link>
              <Link href='/sign-up' className='shrink-0'>
                <Button size='sm'>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}