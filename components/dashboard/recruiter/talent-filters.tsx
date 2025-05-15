'use client'

import { useState } from 'react'

import { Slider } from '@/components/ui/slider'
import { useFilterNavigation } from '@/lib/hooks/use-filter-navigation'
import type { TalentFiltersProps } from '@/lib/types/components'

/* -------------------------------------------------------------------------- */
/*                          R E C R U I T E R   F I L T E R S                 */
/* -------------------------------------------------------------------------- */

export default function TalentFilters({
  basePath,
  initialParams,
  skillMin: initialMin,
  skillMax: initialMax,
  verifiedOnly: initialVerifiedOnly,
  veridaOnly: initialVeridaOnly,
}: TalentFiltersProps) {
  /* Shared navigation helper */
  const updateParam = useFilterNavigation(basePath, initialParams)

  /* ------------------------- Local state -------------------------------- */
  const [range, setRange] = useState<[number, number]>([initialMin, initialMax])
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(initialVerifiedOnly)
  const [veridaOnly, setVeridaOnly] = useState<boolean>(initialVeridaOnly)

  /* ------------------------- Handlers ---------------------------------- */
  function handleRangeChange(v: [number, number]) {
    const min = Math.min(Math.max(0, v[0] ?? 0), 100)
    const max = Math.max(Math.min(100, v[1] ?? 100), 0)
    setRange([min, max])
    updateParam('skillMin', min === 0 ? '' : String(min))
    updateParam('skillMax', max === 100 ? '' : String(max))
    updateParam('page', '1')
  }

  function toggleVerified(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked
    setVerifiedOnly(next)
    updateParam('verifiedOnly', next ? '1' : '')
    updateParam('page', '1')
  }

  function toggleVerida(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked
    setVeridaOnly(next)
    updateParam('verida', next ? '1' : '')
    updateParam('page', '1')
  }

  /* ---------------------------- UI ------------------------------------- */
  return (
    <div className='mb-6 flex flex-wrap items-end gap-4'>
      {/* Skill-score range */}
      <div className='flex flex-col'>
        <label htmlFor='skillRange' className='mb-2 text-sm font-medium'>
          Skill Score ({range[0]}–{range[1]})
        </label>
        <Slider
          id='skillRange'
          min={0}
          max={100}
          step={1}
          value={range}
          onValueChange={handleRangeChange}
          className='w-56'
        />
      </div>

      {/* Verified-only toggle */}
      <div className='flex items-center gap-2 self-center pt-4'>
        <input
          id='verifiedOnly'
          type='checkbox'
          className='accent-primary size-4 cursor-pointer'
          checked={verifiedOnly}
          onChange={toggleVerified}
        />
        <label htmlFor='verifiedOnly' className='cursor-pointer text-sm'>
          Verified only
        </label>
      </div>

      {/* Verida-connected toggle */}
      <div className='flex items-center gap-2 self-center pt-4'>
        <input
          id='veridaOnly'
          type='checkbox'
          className='accent-primary size-4 cursor-pointer'
          checked={veridaOnly}
          onChange={toggleVerida}
        />
        <label htmlFor='veridaOnly' className='cursor-pointer text-sm'>
          Verida connected
        </label>
      </div>
    </div>
  )
}
