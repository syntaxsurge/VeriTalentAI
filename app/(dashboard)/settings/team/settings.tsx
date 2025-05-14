'use client'

import { ArrowRight, Users } from 'lucide-react'

import MembersTable from '@/components/dashboard/settings/members-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import type { SettingsProps } from '@/lib/types/components'

import { InviteTeamMember } from './invite-team'

/* -------------------------------------------------------------------------- */
/*                               Settings Card                                */
/* -------------------------------------------------------------------------- */

export function Settings({
  team,
  rows,
  isOwner,
  page,
  hasNext,
  pageSize,
  sort,
  order,
  searchQuery,
  basePath,
  initialParams,
}: SettingsProps) {
  /**
   * If your `team` object includes a `subscriptionPaidUntil` ISO string, we use it
   * here to decide whether the subscription is still active. Fallback behaviour
   * gracefully degrades when the field is absent.
   */
  const paidUntilDate = team.subscriptionPaidUntil ? new Date(team.subscriptionPaidUntil) : null
  const now = new Date()
  const isActive = paidUntilDate && paidUntilDate > now

  /**
   * Prettify plan label (e.g. "base" → "Base"). Falls back to "Free" when the
   * team has no paid plan.
   */
  const planLabel = team.planName
    ? team.planName.charAt(0).toUpperCase() + team.planName.slice(1)
    : 'Free'

  return (
    <PageCard
      icon={Users}
      title='Team Settings'
      description='Manage your subscription, DID, and team members.'
    >
      <div className='space-y-8'>
        {/* Subscription ---------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Team Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col justify-between gap-6 sm:flex-row'>
              {/* Current plan & status */}
              <div>
                <p className='font-medium'>Current Plan: {planLabel}</p>
                <p className='text-muted-foreground text-sm'>
                  {isActive && paidUntilDate
                    ? `Active until ${paidUntilDate.toLocaleDateString()}`
                    : 'No active subscription'}
                </p>
              </div>

              {/* Manage or upgrade ---------------------------------------- */}
              {team.planName === 'base' || team.planName === 'plus' ? (
                <form action='/api/stripe/portal' method='POST'>
                  <Button type='submit' variant='outline' className='flex items-center gap-2'>
                    Manage Subscription
                    <ArrowRight className='h-4 w-4' />
                  </Button>
                </form>
              ) : (
                <Button asChild variant='outline'>
                  <a href='/pricing' className='flex items-center gap-2'>
                    Upgrade Plan
                    <ArrowRight className='h-4 w-4' />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DID ------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Team DID</CardTitle>
          </CardHeader>
          <CardContent>
            {team.did ? (
              <>
                <p className='text-sm'>DID:</p>
                <p className='font-semibold break-all'>{team.did}</p>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No DID yet. Create one in the Viskify dashboard.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Members --------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <MembersTable
              rows={rows}
              isOwner={isOwner}
              sort={sort}
              order={order}
              basePath={basePath}
              initialParams={initialParams}
              searchQuery={searchQuery}
            />

            <TablePagination
              page={page}
              hasNext={hasNext}
              basePath={basePath}
              initialParams={initialParams}
              pageSize={pageSize}
            />
          </CardContent>
        </Card>

        {/* Invite ---------------------------------------------------------- */}
        <InviteTeamMember isOwner={isOwner} />
      </div>
    </PageCard>
  )
}
