'use client'

import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import {
  Share2,
  Clipboard,
  BookOpen,
  Briefcase,
  Award,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Download,
  Globe2,
} from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import { FaTwitter } from 'react-icons/fa'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

/* ShadCN primitives */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { TablePagination } from '@/components/ui/tables/table-pagination'

/* Internal UI */
import { UserAvatar } from '@/components/ui/user-avatar'
import StatusBadge from '@/components/ui/status-badge'
import CredentialsTable, {
  RowType as CredRow,
} from '@/components/dashboard/recruiter/credentials-table'
import PipelineEntriesTable, {
  RowType as PipeRow,
} from '@/components/dashboard/recruiter/pipeline-entries-table'

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

export interface Experience {
  id: number
  title: string
  company: string | null
  createdAt: Date
}

export interface Project {
  id: number
  title: string
  link: string | null
  description: string | null
  createdAt: Date
}

export interface Socials {
  twitterUrl?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
}

export interface SnapshotMetrics {
  uniqueIssuers: number
  avgScore: number | null
  experienceCount: number
  projectCount: number
}

interface Props {
  candidateId: number
  name: string | null
  email: string
  avatarSrc?: string | null
  bio: string | null
  pipelineSummary?: string
  statusCounts: StatusCounts
  passes: QuizAttempt[]
  snapshot: SnapshotMetrics
  credentials: CredentialsSection
  experiences: Experience[]
  projects: Project[]
  socials: Socials
  pipeline?: PipelineSection
  showShare?: boolean
}

/* -------------------------------------------------------------------------- */
/*                          U T I L I T Y   H O O K S                         */
/* -------------------------------------------------------------------------- */

function usePrettyDate(d?: Date | null) {
  return useMemo(() => {
    if (!d) return '—'
    const diff = Math.abs(Date.now() - d.getTime())
    const threeDays = 1000 * 60 * 60 * 24 * 3
    return diff < threeDays ? formatDistanceToNow(d, { addSuffix: true }) : format(d, 'PPP')
  }, [d])
}

/* -------------------------------------------------------------------------- */
/*                         R E U S A B L E   U I                              */
/* -------------------------------------------------------------------------- */

function StatBlock({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className='flex flex-col items-center gap-1'>
      <span className='text-lg font-bold leading-none'>{value}</span>
      <span className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</span>
    </div>
  )
}

function CollapsibleList<T>({
  title,
  icon: Icon,
  items,
  renderItem,
}: {
  title: string
  icon: React.ElementType
  items: T[]
  renderItem: (item: T) => React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 4)
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Icon className='h-5 w-5 text-primary' />
        <h4 className='text-lg font-semibold'>{title}</h4>
      </div>

      {visible.map((it, i) => (
        <Fragment key={i}>{renderItem(it)}</Fragment>
      ))}

      {items.length > 4 && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setExpanded((p) => !p)}
          className='text-primary gap-1'
        >
          {expanded ? (
            <>
              Show&nbsp;Less <ChevronUp className='h-4 w-4' />
            </>
          ) : (
            <>
              Show&nbsp;More&nbsp;({items.length - 4}) <ChevronDown className='h-4 w-4' />
            </>
          )}
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              M A I N   V I E W                             */
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
  snapshot,
  credentials,
  experiences,
  projects,
  socials,
  pipeline,
  showShare = true,
}: Props) {
  /* -------------------------- Derived helpers --------------------------- */
  const totalCredentials =
    statusCounts.verified + statusCounts.pending + statusCounts.rejected + statusCounts.unverified
  const profilePath = `/candidates/${candidateId}`

  const socialIcons = [
    { href: socials.twitterUrl, icon: FaTwitter, label: 'Twitter' },
    { href: socials.githubUrl, icon: SiGithub, label: 'GitHub' },
    { href: socials.linkedinUrl, icon: SiLinkedin, label: 'LinkedIn' },
    { href: socials.websiteUrl, icon: Globe2, label: 'Website' },
  ].filter((s) => !!s.href)

  function copyLink() {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${profilePath}` : profilePath
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Profile link copied'))
      .catch(() => toast.error('Copy failed'))
  }

  /* ---------------------------------------------------------------------- */
  /*                                 RENDER                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <TooltipProvider delayDuration={150}>
      <section className='space-y-10'>
        {/* ------------------------------ COVER --------------------------- */}
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
                <Link href={`mailto:${email}`} className='underline underline-offset-4 break-all'>
                  {email}
                </Link>
              </div>
            </div>

            {/* Actions */}
            {showShare && (
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

          {/* Stats strip – consolidated */}
          <div className='border-t bg-background/60 backdrop-blur'>
            <div className='mx-auto grid max-w-3xl grid-cols-3 gap-6 p-4 text-center'>
              <StatBlock value={totalCredentials} label='Credentials' />
              <StatBlock value={passes.length} label='Skill Passes' />
              <StatBlock value={pipelineSummary || '—'} label='Pipelines' />
            </div>
          </div>

          {/* Social links */}
          {socialIcons.length > 0 && (
            <div className='flex flex-wrap items-center justify-center gap-2 border-t p-4'>
              {socialIcons.map((s) => (
                <Tooltip key={s.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      asChild
                      className='bg-muted hover:bg-muted/70'
                    >
                      <Link href={s.href!} target='_blank' rel='noopener noreferrer'>
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
        </div>

        {/* ---------------------------- LAYOUT --------------------------- */}
        <div className='grid gap-8 lg:grid-cols-[280px_1fr]'>
          {/* --------------------------- SIDEBAR -------------------------- */}
          <aside className='space-y-8'>
            {/* PDF Resume card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Download className='h-5 w-5' />
                  Résumé&nbsp;PDF
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  Generate a professionally formatted résumé summarizing your profile, credentials,
                  experiences, and projects.
                </p>
                <Button variant='secondary' className='w-full gap-2' asChild>
                  <a href={`/api/candidates/${candidateId}/resume`} download>
                    <Download className='h-4 w-4' />
                    Download&nbsp;PDF
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Snapshot card */}
            <Card className='sticky top-24'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <BarChart4 className='h-5 w-5' />
                  Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Issuers</dt>
                    <dd className='text-lg font-bold'>{snapshot.uniqueIssuers}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Avg&nbsp;Score</dt>
                    <dd className='text-lg font-bold'>
                      {snapshot.avgScore !== null ? `${snapshot.avgScore}%` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Experience</dt>
                    <dd className='text-lg font-bold'>{snapshot.experienceCount}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Projects</dt>
                    <dd className='text-lg font-bold'>{snapshot.projectCount}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </aside>

          {/* ----------------------------- MAIN --------------------------- */}
          <main className='space-y-12'>
            {/* About */}
            {bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='whitespace-pre-line'>{bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Experiences & Projects */}
            <Tabs defaultValue='experience' className='space-y-6'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='experience' className='gap-2'>
                  <Briefcase className='h-4 w-4' />
                  Experience
                </TabsTrigger>
                <TabsTrigger value='projects' className='gap-2'>
                  <BookOpen className='h-4 w-4' />
                  Projects
                </TabsTrigger>
              </TabsList>

              <TabsContent value='experience'>
                {experiences.length === 0 ? (
                  <p className='text-muted-foreground'>No experience credentials yet.</p>
                ) : (
                  <ScrollArea className='h-[500px] pr-3'>
                    <CollapsibleList
                      title='Professional Experience'
                      icon={Briefcase}
                      items={experiences}
                      renderItem={(exp) => (
                        <div className='space-y-1'>
                          <h5 className='font-semibold'>{exp.title}</h5>
                          {exp.company && (
                            <p className='text-muted-foreground text-sm'>{exp.company}</p>
                          )}
                          <p className='text-muted-foreground text-xs'>
                            Added {usePrettyDate(exp.createdAt)}
                          </p>
                        </div>
                      )}
                    />
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value='projects'>
                {projects.length === 0 ? (
                  <p className='text-muted-foreground'>No project credentials yet.</p>
                ) : (
                  <ScrollArea className='h-[500px] pr-3'>
                    <CollapsibleList
                      title='Highlighted Projects'
                      icon={BookOpen}
                      items={projects}
                      renderItem={(proj) => (
                        <div className='space-y-1'>
                          <h5 className='font-semibold'>{proj.title}</h5>
                          {proj.description && <p className='text-sm'>{proj.description}</p>}
                          {proj.link && (
                            <Button
                              asChild
                              variant='link'
                              size='sm'
                              className='-ml-2 text-primary'
                            >
                              <Link href={proj.link} target='_blank'>
                                Visit&nbsp;Link
                              </Link>
                            </Button>
                          )}
                          <p className='text-muted-foreground text-xs'>
                            Added {usePrettyDate(proj.createdAt)}
                          </p>
                        </div>
                      )}
                    />
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

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

              <CardContent className='space-y-4'>
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

            {/* Pipeline entries */}
            {pipeline && (
              <Card id='pipeline-entries'>
                <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
                  <CardTitle>Pipeline Entries</CardTitle>
                  {pipeline.addToPipelineForm}
                </CardHeader>
                <CardContent className='space-y-4'>
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

            {/* Skill passes */}
            <Card id='skill-passes'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Award className='h-5 w-5' />
                  Skill Passes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {passes.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No passes yet.</p>
                ) : (
                  <ul className='space-y-3'>
                    {passes.map((p) => (
                      <li
                        key={p.id}
                        className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2'
                      >
                        <span className='font-medium'>
                          Quiz&nbsp;#{p.quizId} • Score&nbsp;{p.score ?? '—'}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {usePrettyDate(p.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </section>
    </TooltipProvider>
  )
}