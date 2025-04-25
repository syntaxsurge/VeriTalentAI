'use client'

import Link from 'next/link'
import { Clipboard, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusBadge from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface Credential {
  id: number
  title: string
  issuer: string | null
  status: string
  fileUrl: string | null
}

interface Props {
  name: string | null               /* display name – nullable */
  email: string                     /* primary email – always present */
  avatarSrc?: string | null         /* optional avatar URL */
  bio: string | null                /* free-text bio */
  pipelineSummary?: string          /* high-level pipeline summary – recruiter page only */
  statusCounts: {
    verified: number
    pending: number
    rejected: number
    unverified: number
  }
  passes: number                    /* # of passed skill quizzes */
  credentials: Credential[]         /* credential rows to render */
  showShare?: boolean               /* show "Share” dropdown (public view) */
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

function copyUrl() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => toast.success('Profile link copied.'))
    .catch(() => toast.error('Copy failed.'))
}

function shareNative() {
  if (!navigator.share) {
    copyUrl()
    return
  }
  navigator
    .share({ url: window.location.href })
    .catch(() => toast.error('Share cancelled or failed.'))
}

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */

export default function CandidateProfileView({
  name,
  email,
  avatarSrc,
  bio,
  pipelineSummary,
  statusCounts,
  passes,
  credentials,
  showShare = false,
}: Props) {
  const totalVerified = statusCounts.verified

  return (
    <section className='space-y-10'>
      {/* Header / hero */}
      <div className='relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/70 p-10 text-primary-foreground shadow-lg'>
        <div className='flex flex-col items-center gap-8 sm:flex-row'>
          <UserAvatar
            src={avatarSrc ?? undefined}
            name={name}
            email={email}
            className='size-32 text-4xl ring-4 ring-white/40'
          />

          <div className='flex-1 space-y-4 text-center sm:text-left'>
            <div>
              <h1 className='text-4xl font-bold tracking-tight'>
                {name || 'Unnamed Candidate'}
              </h1>
              <Link
                href={`mailto:${email}`}
                className='text-primary-foreground/90 underline-offset-4 hover:underline'
              >
                {email}
              </Link>
            </div>

            {/* Badges */}
            <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
              {pipelineSummary && (
                <Badge variant='secondary' className='capitalize'>
                  {pipelineSummary}
                </Badge>
              )}

              {totalVerified > 0 && (
                <Badge variant='secondary'>
                  {totalVerified} verified credential{totalVerified === 1 ? '' : 's'}
                </Badge>
              )}

              {passes > 0 && (
                <Badge variant='secondary'>
                  {passes} skill pass{passes === 1 ? '' : 'es'}
                </Badge>
              )}
            </div>

            {/* Bio */}
            <p className='mx-auto max-w-3xl whitespace-pre-line text-sm leading-relaxed opacity-90 sm:mx-0'>
              {bio || 'No bio provided.'}
            </p>

            {/* Share dropdown */}
            {showShare && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='mt-4'
                  >
                    <Share2 className='mr-2 h-4 w-4' />
                    Share&nbsp;Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
                  <DropdownMenuItem onClick={copyUrl} className='cursor-pointer'>
                    <Clipboard className='mr-2 h-4 w-4' />
                    Copy&nbsp;URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareNative} className='cursor-pointer'>
                    <Share2 className='mr-2 h-4 w-4' />
                    Native&nbsp;Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Credentials */}
      <Card id='credentials'>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Credentials
            <StatusBadge status='verified' showIcon count={statusCounts.verified} />
            <StatusBadge status='pending' showIcon count={statusCounts.pending} />
            <StatusBadge status='rejected' showIcon count={statusCounts.rejected} />
            <StatusBadge status='unverified' showIcon count={statusCounts.unverified} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No credentials uploaded.</p>
          ) : (
            <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {credentials.map((c) => (
                <li key={c.id}>
                  <Card className='h-full'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-base'>{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <p className='text-sm'>
                        <span className='font-medium'>Issuer:&nbsp;</span>
                        {c.issuer || '—'}
                      </p>
                      <StatusBadge status={c.status} />
                      {c.fileUrl && (
                        <Link
                          href={c.fileUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary text-sm underline'
                        >
                          View&nbsp;File
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}