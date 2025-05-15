'use client'

import * as React from 'react'
import type { ReactElement } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useVeridaSearch } from '@/lib/hooks/use-verida-search'
import { cn } from '@/lib/utils'

type SearchTelegramModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Search scope: 'telegram' limits to chat data; 'all' performs universal search. */
  scope?: 'telegram' | 'all'
}

export default function SearchTelegramModal({
  open,
  onOpenChange,
  scope = 'telegram',
}: SearchTelegramModalProps): ReactElement {
  const [keywords, setKeywords] = React.useState('')
  const [currentScope, setCurrentScope] = React.useState<'telegram' | 'all'>(scope)
  const { loading, results, error, search } = useVeridaSearch<any>()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!keywords.trim()) {
      toast.error('Please enter at least one keyword.')
      return
    }
    await search(keywords.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Search My Verida Data</DialogTitle>
          <DialogDescription>
            Enter keywords to run a Universal Search across your connected Verida datastores.
          </DialogDescription>
        </DialogHeader>

        {/* Datastore scope selector */}
        <div className='flex gap-2'>
          {(['all', 'telegram'] as const).map((s) => (
            <button
              key={s}
              type='button'
              onClick={() => setCurrentScope(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                currentScope === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {s === 'all' ? 'All Data' : 'Telegram'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className='mt-4 flex gap-2'>
          <Input
            placeholder='e.g. cluster protocol defi'
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            autoFocus
          />
          <Button type='submit' disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </form>

        {error && <p className='text-destructive text-sm'>{error}</p>}

        <div className='mt-4'>
          <h4 className='text-sm font-medium'>
            {loading ? 'Searching…' : `Results ${results.length > 0 ? `(${results.length})` : ''}`}
          </h4>
          <ScrollArea className='mt-2 h-64 rounded border p-2'>
            {results.length === 0 && !loading ? (
              <p className='text-muted-foreground text-sm'>No results found.</p>
            ) : (
              <pre className='text-xs break-words whitespace-pre-wrap'>
                {JSON.stringify(results, null, 2)}
              </pre>
            )}
          </ScrollArea>
        </div>

        <DialogClose asChild>
          <Button variant='secondary' className='mt-4 w-full'>
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
