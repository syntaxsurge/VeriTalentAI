'use client'

import * as React from 'react'

import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import VeridaConnectButton from '@/components/ui/verida-connect-button'
import type { TelegramGroup, TelegramMessage, KeywordStats } from '@/lib/types/telegram'
import { prettify } from '@/lib/utils'

type Props = {
  userId: number
  veridaConnected: boolean
}

const REFRESH_INTERVAL = 30_000

export default function VeridaTelegramDashboard({ userId, veridaConnected }: Props) {
  /* ------------------------------- state -------------------------------- */
  const [groups, setGroups] = React.useState<TelegramGroup[]>([])
  const [messages, setMessages] = React.useState<TelegramMessage[]>([])
  const [keywordStats, setKeywordStats] = React.useState<KeywordStats>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  /* AI insights modal */
  const [insightsOpen, setInsightsOpen] = React.useState(false)
  const [insightsLoading, setInsightsLoading] = React.useState(false)
  const [insights, setInsights] = React.useState<string>('')

  /* --------------------------- fetch helpers ---------------------------- */
  const fetchAll = React.useCallback(async () => {
    if (!veridaConnected) return
    setLoading(true)
    setError(null)
    try {
      const [gRes, mRes, sRes] = await Promise.all([
        fetch(`/api/telegram/groups?userId=${userId}`),
        fetch(`/api/telegram/messages?userId=${userId}`),
        fetch(`/api/telegram/stats?userId=${userId}`),
      ])

      const gJson = await gRes.json()
      const mJson = await mRes.json()
      const sJson = await sRes.json()

      if (!gJson.success) throw new Error(gJson.error ?? 'Failed to fetch groups')
      if (!mJson.success) throw new Error(mJson.error ?? 'Failed to fetch messages')
      if (!sJson.success) throw new Error(sJson.error ?? 'Failed to fetch stats')

      setGroups(Array.isArray(gJson.groups) ? gJson.groups : gJson)
      setMessages(Array.isArray(mJson.messages) ? mJson.messages : mJson)
      setKeywordStats(sJson.stats?.messages?.keywordCounts ?? {})
    } catch (err: any) {
      setError(err.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [userId, veridaConnected])

  /* --------------------------- initial load ----------------------------- */
  React.useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /* --------------------------- auto refresh ----------------------------- */
  React.useEffect(() => {
    if (!veridaConnected) return
    const id = setInterval(fetchAll, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAll, veridaConnected])

  /* ---------------------- AI insights generation ------------------------ */
  async function handleGenerateInsights() {
    setInsightsLoading(true)
    try {
      const res = await fetch(`/api/telegram/insights?userId=${userId}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Failed to generate insights')
      setInsights(JSON.stringify(JSON.parse(json.insights), null, 2))
      setInsightsOpen(true)
    } catch (err: any) {
      toast.error(err?.message ?? 'Unable to generate AI insights.')
    } finally {
      setInsightsLoading(false)
    }
  }

  /* ----------------------------- render --------------------------------- */
  if (!veridaConnected) {
    return (
      <div className='flex flex-col items-center gap-4 py-12 text-center'>
        <p className='text-muted-foreground max-w-sm'>
          Connect your Verida account to access your Telegram data.
        </p>
        <VeridaConnectButton />
      </div>
    )
  }

  if (loading) {
    return <p className='text-muted-foreground py-8 text-center'>Loading Telegram data…</p>
  }

  if (error) {
    return (
      <div className='flex flex-col items-center gap-4 py-8 text-center'>
        <p className='text-destructive'>{error}</p>
        <Button onClick={fetchAll}>Retry</Button>
      </div>
    )
  }

  return (
    <>
      {/* Header with insights action */}
      <div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <h2 className='text-lg font-semibold'>Telegram Overview</h2>
        <Button onClick={handleGenerateInsights} disabled={insightsLoading}>
          {insightsLoading ? 'Generating…' : 'Generate AI Insights'}
        </Button>
      </div>

      <div className='space-y-8'>
        {/* Summary */}
        <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-4'>
          <SummaryCard label='Groups' value={groups.length} />
          <SummaryCard label='Messages' value={messages.length} />
          {Object.entries(keywordStats).map(([kw, count]) => (
            <SummaryCard key={kw} label={prettify(kw)} value={count} />
          ))}
        </div>

        {/* Groups */}
        <SectionCard title={`Groups (${groups.length})`}>
          {groups.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No Telegram groups found.</p>
          ) : (
            <ScrollArea className='h-64 pr-4'>
              <ul className='space-y-2'>
                {groups.map((g, i) => (
                  <li key={i} className='flex items-center gap-3'>
                    <div
                      className='h-2 w-2 rounded-full'
                      style={{ backgroundColor: generateColor(String(g.groupId ?? g.id ?? i)) }}
                    />
                    <span className='truncate'>
                      {g.groupName ?? g.name ?? g.title ?? 'Unnamed'}
                    </span>
                    {g.groupId || g.id ? (
                      <Badge variant='secondary' className='ml-auto'>
                        {g.groupId ?? g.id}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </SectionCard>

        {/* Messages */}
        <SectionCard title={`Messages (${messages.length})`}>
          {messages.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No Telegram messages found.</p>
          ) : (
            <ScrollArea className='h-96 pr-4'>
              <ul className='space-y-4'>
                {messages.slice(0, 100).map((m, i) => (
                  <li key={i} className='space-y-1'>
                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <span className='font-medium'>
                        {m.fromName ?? m.sender ?? m.from ?? 'Unknown'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(m.date ?? m.timestamp)}</span>
                    </div>
                    <p className='text-sm break-words whitespace-pre-wrap'>
                      {m.messageText ?? m.message ?? m.text ?? '(no content)'}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </SectionCard>
      </div>

      {/* Insights Dialog */}
      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>AI Telegram Insights</DialogTitle>
          </DialogHeader>

          <ScrollArea className='max-h-[70vh] rounded border p-3'>
            {insights ? (
              <pre className='text-xs break-words whitespace-pre-wrap'>{insights}</pre>
            ) : (
              <p className='text-muted-foreground text-sm'>No insights available.</p>
            )}
          </ScrollArea>

          <DialogClose asChild>
            <Button variant='secondary' className='mt-4 w-full'>
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                               utilities                                    */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className='flex flex-col items-center justify-center gap-1 py-6'>
      <span className='text-2xl font-bold'>{value}</span>
      <span className='text-muted-foreground text-sm tracking-wider uppercase'>{label}</span>
    </Card>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className='border-b px-4 py-3 text-sm font-semibold'>{title}</h3>
      <div className='p-4'>{children}</div>
    </Card>
  )
}

function formatDate(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function generateColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue},70%,60%)`
}
