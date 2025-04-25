'use client'

import Link from 'next/link'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  /** display name – nullable */
  name: string | null
  /** primary email – always present */
  email: string
  /** optional avatar URL */
  avatarSrc?: string | null
  /** free-text bio */
  bio: string | null
  /** high-level pipeline summary – recruiter page only */
  pipelineSummary?: string
  /** credential status counts */
  statusCounts: {
    verified: number
    pending: number
    rejected: number
    unverified: number
  }
  /** # of passed skill quizzes */
  passes: number
  /** credential rows to render */
  credentials: Credential[]
  /** show "Share” button (public view) */
  showShare?: boolean
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

function handleShare() {
  const url = window.location.href
  if (navigator.share) {
    navigator
      .share({ url })
      .catch(() => toast.error('Share cancelled or failed.'))
  } else {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Profile link copied.'))
      .catch(() => toast.error('Copy failed.'))
  }
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

            {/* Share */}
            {showShare && (
              <Button
                variant='secondary'
                size='sm'
                className='mt-4'
                onClick={handleShare}
              >
                <Share2 className='mr-2 h-4 w-4' />
                Share&nbsp;Profile
              </Button>
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