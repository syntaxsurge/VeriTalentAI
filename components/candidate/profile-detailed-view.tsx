'use client'

/* -------------------------------------------------------------------------- */
/*                                I M P O R T S                               */
/* -------------------------------------------------------------------------- */

import Link from 'next/link'
import Image from 'next/image'
import { Fragment, useMemo, useState } from 'react'
import {
  Mail,
  MapPin,
  BadgeCheck,
  Share2,
  Clipboard,
  Users2,
  BookOpen,
  Briefcase,
  Award,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Download,
  Globe2,
  Twitter,
  Github,
  Linkedin,
  FileText,
} from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'

/* Internal UI */
import { UserAvatar } from '@/components/ui/user-avatar'
import StatusBadge from '@/components/ui/status-badge'
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

interface Props {
  candidateId: number
  name: string | null
  email: string
  avatarSrc?: string | null
  bio: string | null
  pipelineSummary?: string
  statusCounts: StatusCounts
  passes: QuizAttempt[]
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

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: React.ReactNode
  label: string
}) {
  return (
    <div className='bg-background/70 border-border/50 flex flex-col items-center rounded-lg border p-2 shadow-sm backdrop-blur'>
      <Icon className='h-4 w-4 text-primary' />
      <span className='text-sm font-semibold'>{value}</span>
      <span className='text-muted-foreground text-[10px] uppercase'>{label}</span>
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex items-center gap-3 py-8'>
      <Separator className='flex-1' />
      <h3 className='text-muted-foreground text-xs font-semibold uppercase tracking-widest'>
        {children}
      </h3>
      <Separator className='flex-1' />
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
  credentials,
  experiences,
  projects,
  socials,
  pipeline,
  showShare = true,
}: Props) {
  /* -------------------------- Derived helpers --------------------------- */

  const totalVerified = statusCounts.verified
  /* Use a stable relative path for SSR/CSR consistency */
  const profilePath = `/candidates/${candidateId}`

  const socialIcons = [
    { href: socials.twitterUrl, icon: Twitter, label: 'Twitter' },
    { href: socials.githubUrl, icon: Github, label: 'GitHub' },
    { href: socials.linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
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
        {/* ------------------------------ HEADER --------------------------- */}
        <header className='relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl'>
          {/* decorative blur blob */}
          <div className='pointer-events-none absolute inset-0 -z-10'>
            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-background/10 blur-3xl' />
          </div>

          <div className='grid grid-cols-12 items-start gap-6 p-8 text-primary-foreground'>
            {/* Avatar */}
            <div className='col-span-12 sm:col-span-3 flex justify-center sm:justify-start'>
              <HoverCard openDelay={100}>
                <HoverCardTrigger asChild>
                  <UserAvatar
                    src={avatarSrc ?? undefined}
                    name={name}
                    email={email}
                    className='size-36 ring-4 ring-white/30'
                  />
                </HoverCardTrigger>
                <HoverCardContent className='w-60 text-center'>
                  <p className='font-semibold'>{name || email}</p>
                  <p className='text-muted-foreground truncate text-xs'>{email}</p>
                </HoverCardContent>
              </HoverCard>
            </div>

            {/* Identity & socials */}
            <div className='col-span-12 sm:col-span-6 space-y-4 text-center sm:text-left'>
              <div>
                <h1 className='text-3xl font-extrabold leading-snug'>{name || 'Unnamed'}</h1>
                <Link href={`mailto:${email}`} className='underline underline-offset-4 break-all'>
                  {email}
                </Link>
              </div>

              {bio && <p className='mx-auto max-w-xl whitespace-pre-line sm:mx-0'>{bio}</p>}

              {/* Social icons */}
              <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
                {socialIcons.map((s) => (
                  <Tooltip key={s.label}>
                    <TooltipTrigger asChild>
                      <Button variant='ghost' size='icon' asChild className='backdrop-blur'>
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
            </div>

            {/* Stats & share */}
            <div className='col-span-12 sm:col-span-3 flex flex-col items-center sm:items-end gap-4'>
              <div className='flex flex-wrap justify-center gap-3 sm:justify-end'>
                <StatChip icon={BadgeCheck} value={totalVerified} label='Verified' />
                <StatChip icon={Award} value={passes.length} label='Skill Passes' />
                <StatChip icon={Users2} value={pipelineSummary || '—'} label='Pipelines' />
              </div>

              {showShare && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='secondary' size='sm' className='backdrop-blur'>
                      <Share2 className='mr-2 h-4 w-4' />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='rounded-lg p-1 shadow-lg backdrop-blur'>
                    <DropdownMenuItem onClick={copyLink} className='cursor-pointer'>
                      <Clipboard className='mr-2 h-4 w-4' />
                      Copy&nbsp;URL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* ---------------------------- LAYOUT --------------------------- */}
        <div className='grid gap-8 lg:grid-cols-[300px_1fr]'>
          {/* --------------------------- SIDEBAR -------------------------- */}
          <aside className='space-y-8'>
            {/* Résumé */}
            <Card className='sticky top-24 overflow-hidden'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <FileText className='h-5 w-5' />
                  Résumé
                </CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-3'>
                <p className='text-sm leading-relaxed'>
                  Download a PDF résumé generated from verified data.
                </p>
                <Button asChild variant='secondary' size='sm' className='gap-2'>
                  <a href={`/api/candidates/${candidateId}/resume`} download>
                    <Download className='h-4 w-4' />
                    Download&nbsp;PDF
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Snapshot */}
            <Card className='sticky top-[220px]'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <BarChart4 className='h-5 w-5' />
                  Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Verified</dt>
                    <dd className='text-lg font-bold'>{statusCounts.verified}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Pending</dt>
                    <dd className='text-lg font-bold'>{statusCounts.pending}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Rejected</dt>
                    <dd className='text-lg font-bold'>{statusCounts.rejected}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Unverified</dt>
                    <dd className='text-lg font-bold'>{statusCounts.unverified}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </aside>

          {/* ----------------------------- MAIN --------------------------- */}
          <main className='space-y-12'>
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
                  <ScrollArea className='h-[560px] pr-3'>
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
                  <ScrollArea className='h-[560px] pr-3'>
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
                            Added {usePrettyDate(proj.createdAt as Date)}
                          </p>
                        </div>
                      )}
                    />
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            <SectionDivider>Credentials</SectionDivider>

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

            {pipeline && (
              <>
                <SectionDivider>Pipeline Entries</SectionDivider>
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
              </>
            )}

            <SectionDivider>Skill Quiz Passes</SectionDivider>

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
                          {usePrettyDate(p.createdAt as Date)}
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