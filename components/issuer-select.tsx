'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface IssuerOption {
  id: number
  name: string
  category: string
  industry: string
}

type Props = {
  issuers: IssuerOption[]
}

export default function IssuerSelect({ issuers }: Props) {
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    if (!query) return issuers
    return issuers.filter((i) =>
      `${i.name} ${i.category} ${i.industry}`.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query, issuers])

  return (
    <div className='space-y-2'>
      <Label htmlFor='issuerId'>Issuer (optional)</Label>
      <Input
        placeholder='Search issuer…'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        id='issuerId'
        name='issuerId'
        className='h-10 w-full rounded-md border px-2'
        defaultValue=''
      >
        <option value=''>— Skip issuer for now —</option>
        {filtered.map((i) => (
          <option key={i.id} value={i.id} className='capitalize'>
            {i.name} ({i.category.replaceAll('_', ' ').toLowerCase()})
          </option>
        ))}
      </select>
    </div>
  )
}
