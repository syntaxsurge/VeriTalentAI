'use client'

import Link from 'next/link'
import { format } from 'date-fns'
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
import CredentialsTable, {
  RowType as CredRow,
} from '@/components/dashboard/recruiter/credentials-table'
import PipelineEntriesTable, {
  RowType as PipeRow,
} from '@/components/dashboard/recruiter/pipeline-entries-table'
import { TablePagination } from '@/components/ui/tables/table-pagination'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface StatusCounts {
  verified: number
  pending: number
  rejected: number
  unverified: number
}

export interface Pagination {
  page: number
  hasNext: boolean
  pageSize: number
  basePath: string
  initialParams: Record<string, string>
}

export interface CredentialsSection {
  rows: CredRow[]
  sort: string
  order: 'asc' | 'desc'
  pagination: Pagination
}

export interface PipelineSection {
  rows: PipeRow[]
  sort: string
  order: 'asc' | 'desc'
  pagination: Pagination
  addToPipelineForm?: React.ReactNode
}

export interface QuizAttempt {
  id: number
  quizId: number
  score: number | null
  maxScore: number | null
  createdAt: Date
}

interface Props {
  /** Candidate primary key used to build canonical /candidates/{id} URL */
  candidateId: number
  name: string | null
  email: string
  avatarSrc?: string | null
  bio: string | null
  pipelineSummary?: string
  statusCounts: StatusCounts
  passes: QuizAttempt[]
  credentials: CredentialsSection
  pipeline?: PipelineSection
  /** Show Share Profile dropdown (defaults to true) */
  showShare?: boolean
}

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */

export default function CandidateDetailedProfileView({
  candidateId,
  name,
  email,
  avatarSrc,
  bio,
  pipelineSummary,
  statusCounts,
  passes,
  credentials,
  pipeline,
  showShare = true,
}: Props) {
  const totalVerified = statusCounts.verified

  /* Canonical public profile URL (always /candidates/{id}) */
  const profileUrl =
    typeof window === 'undefined'
      ? `/candidates/${candidateId}`
      : `${window.location.origin}/candidates/${candidateId}`

  function handleCopy() {
    navigator.clipboard
      .writeText(profileUrl)
      .then(() => toast.success('Profile link copied.'))
      .catch(() => toast.error('Copy failed.'))
  }

  function handleShare() {
    if (!navigator.share) {
      handleCopy()
      return
    }
    navigator
      .share({ url: profileUrl })
      .catch(() => toast.error('Share cancelled or failed.'))
  }

  return (
    <section className='space-y-10'>
      {/* ------------------------------------------------------------------ */}
      {/*                               HERO                                 */}
      {/* ------------------------------------------------------------------ */}
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

            {/* Dynamic badges */}
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

              {passes.length > 0 && (
                <Badge variant='secondary'>
                  {passes.length} skill quiz pass{passes.length === 1 ? '' : 'es'}
                </Badge>
              )}
            </div>

            <p className='mx-auto max-w-3xl whitespace-pre-line text-sm leading-relaxed opacity-90 sm:mx-0'>
              {bio || 'No bio provided.'}
            </p>

            {showShare && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='secondary' size='sm' className='mt-4'>
                    <Share2 className='mr-2 h-4 w-4' />
                    Share&nbsp;Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
                  <DropdownMenuItem onClick={handleCopy} className='cursor-pointer'>
                    <Clipboard className='mr-2 h-4 w-4' />
                    Copy&nbsp;URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className='cursor-pointer'>
                    <Share2 className='mr-2 h-4 w-4' />
                    Native&nbsp;Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                       PIPELINE ENTRIES (optional)                   */}
      {/* ------------------------------------------------------------------ */}
      {pipeline && (
        <Card id='pipeline-entries'>
          <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
            <CardTitle>Pipeline&nbsp;Entries</CardTitle>
            {pipeline.addToPipelineForm}
          </CardHeader>

          <CardContent>
            <PipelineEntriesTable
              rows={pipeline.rows}
              sort={pipeline.sort}
              order={pipeline.order}
              basePath={pipeline.pagination.basePath}
              initialParams={pipeline.pagination.initialParams}
              searchQuery={pipeline.pagination.initialParams['pipeQ'] ?? ''}
            />

            <TablePagination
              page={pipeline.pagination.page}
              hasNext={pipeline.pagination.hasNext}
              basePath={pipeline.pagination.basePath}
              initialParams={pipeline.pagination.initialParams}
              pageSize={pipeline.pagination.pageSize}
            />
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*                            CREDENTIALS                              */}
      {/* ------------------------------------------------------------------ */}
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
          <CredentialsTable
            rows={credentials.rows}
            sort={credentials.sort}
            order={credentials.order}
            basePath={credentials.pagination.basePath}
            initialParams={credentials.pagination.initialParams}
            searchQuery={credentials.pagination.initialParams['q'] ?? ''}
          />

          <TablePagination
            page={credentials.pagination.page}
            hasNext={credentials.pagination.hasNext}
            basePath={credentials.pagination.basePath}
            initialParams={credentials.pagination.initialParams}
            pageSize={credentials.pagination.pageSize}
          />
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/*                            SKILL PASSES                             */}
      {/* ------------------------------------------------------------------ */}
      <Card id='skill-passes'>
        <CardHeader>
          <CardTitle>Skill&nbsp;Quiz&nbsp;Passes</CardTitle>
        </CardHeader>

        <CardContent className='space-y-2 text-sm'>
          {passes.length === 0 ? (
            <p className='text-muted-foreground'>None.</p>
          ) : (
            passes.map((p) => (
              <p key={p.id}>
                Quiz&nbsp;#{p.quizId}&nbsp;—&nbsp;Score&nbsp;{p.score}&nbsp;/&nbsp;
                {p.maxScore ?? 100}&nbsp;•&nbsp;{format(p.createdAt, 'PPP')}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}