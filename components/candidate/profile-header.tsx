'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { Share2, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export interface Stat {
  label: string
  value: React.ReactNode
}

export interface Social {
  href: string
  icon: React.ElementType
  label: string
}

interface ProfileHeaderProps {
  name: string | null
  email: string
  avatarSrc?: string | null
  profilePath?: string
  showShare?: boolean
  stats?: Stat[]
  socials?: Social[]
  children?: ReactNode
}

export default function ProfileHeader({
  name,
  email,
  avatarSrc,
  profilePath,
  showShare = false,
  stats = [],
  socials = [],
  children,
}: ProfileHeaderProps) {
  /* ---------------------------- share link ---------------------------- */
  function copyLink() {
    if (!profilePath) return
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${profilePath}` : profilePath
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Profile link copied'))
      .catch(() => toast.error('Copy failed'))
  }

  /* ------------------------------- view ------------------------------- */
  return (
    <TooltipProvider delayDuration={150}>
      <div className='overflow-hidden rounded-2xl border bg-muted/40 shadow-sm'>
        {/* Decorative banner */}
        <div className='h-32 w-full bg-gradient-to-r from-primary/30 via-primary/10 to-transparent' />

        <div className='flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between'>
          {/* Avatar + identity */}
          <div className='flex flex-col items-center gap-4 sm:flex-row sm:items-end'>
            <UserAvatar
              src={avatarSrc ?? undefined}
              name={name}
              email={email}
              className='-mt-20 size-28 ring-4 ring-background sm:-mt-14'
            />
            <div className='text-center sm:text-left'>
              <h1 className='text-2xl font-extrabold leading-tight'>{name || 'Unnamed'}</h1>
              <Link href={`mailto:${email}`} className='break-all underline underline-offset-4'>
                {email}
              </Link>
            </div>
          </div>

          {/* Share */}
          {showShare && profilePath && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='gap-2'>
                  <Share2 className='h-4 w-4' />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='rounded-lg p-1 shadow-lg'>
                <DropdownMenuItem onClick={copyLink} className='cursor-pointer'>
                  <Clipboard className='mr-2 h-4 w-4' />
                  Copy&nbsp;URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div className='border-t bg-background/60 backdrop-blur'>
            <div
              className='mx-auto grid max-w-3xl gap-6 p-4 text-center'
              style={{ gridTemplateColumns: `repeat(${stats.length},minmax(0,1fr))` }}
            >
              {stats.map((s) => (
                <div key={s.label} className='flex flex-col items-center gap-1'>
                  <span className='text-lg font-bold leading-none'>{s.value}</span>
                  <span className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Socials */}
        {socials.length > 0 && (
          <div className='flex flex-wrap items-center justify-center gap-2 border-t p-4'>
            {socials.map((s) => (
              <Tooltip key={s.label}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant='ghost'
                    size='icon'
                    className='bg-muted hover:bg-muted/70'
                  >
                    <Link href={s.href} target='_blank' rel='noopener noreferrer'>
                      <s.icon className='h-4 w-4' />
                      <span className='sr-only'>{s.label}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{s.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {children}
      </div>
    </TooltipProvider>
  )
}