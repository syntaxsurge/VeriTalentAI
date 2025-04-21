'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import MembersTable, { RowType } from '@/components/dashboard/settings/members-table'
import { InviteTeamMember } from './invite-team'

interface TeamMeta {
  planName: string | null
  subscriptionStatus: string | null
  did: string | null
}

interface SettingsProps {
  team: TeamMeta
  rows: RowType[]
  isOwner: boolean
  page: number
  hasNext: boolean
  pageSize: number
  sort: string
  order: 'asc' | 'desc'
  searchQuery: string
  basePath: string
  initialParams: Record<string, string>
}

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
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="mb-6 text-lg font-medium lg:text-2xl">Team Settings</h1>

      {/* Subscription */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <p className="font-medium">Current Plan: {team.planName || 'Free'}</p>
              <p className="text-muted-foreground text-sm">
                {team.subscriptionStatus === 'active'
                  ? 'Billed monthly'
                  : team.subscriptionStatus === 'trialing'
                  ? 'Trial period'
                  : 'No active subscription'}
              </p>
            </div>
            <form action="/api/stripe/portal">
              <Button type="submit" variant="outline">
                Manage Subscription
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* DID */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team DID</CardTitle>
        </CardHeader>
        <CardContent>
          {team.did ? (
            <>
              <p className="text-sm">cheqd DID:</p>
              <p className="break-all font-semibold">{team.did}</p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No DID yet. Create one in the Viskify AI dashboard.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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

      {/* Invite */}
      <InviteTeamMember isOwner={isOwner} />
    </section>
  )
}