'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'

interface TalentFiltersProps {
  basePath: string
  initialParams: Record<string, string>
  skillMin: number
  verifiedOnly: boolean
}

function buildLink(
  basePath: string,
  init: Record<string, string>,
  overrides: Record<string, any>,
) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => {
    if (v === '' || v === false || v === undefined || v === null) {
      sp.delete(k)
    } else {
      sp.set(k, String(v))
    }
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

export default function TalentFilters({
  basePath,
  initialParams,
  skillMin: initialSkillMin,
  verifiedOnly: initialVerifiedOnly,
}: TalentFiltersProps) {
  const router = useRouter()
  const [skillMin, setSkillMin] = useState<number>(initialSkillMin)
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(initialVerifiedOnly)

  /* Push updated query string on change */
  useEffect(() => {
    const href = buildLink(basePath, initialParams, {
      skillMin: skillMin || '',
      verifiedOnly: verifiedOnly ? '1' : '',
      page: 1, // reset pagination on filter change
    })
    router.push(href, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillMin, verifiedOnly])

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      {/* Minimum skill score */}
      <div className="flex flex-col">
        <label htmlFor="skillMin" className="mb-1 text-sm font-medium">
          Min&nbsp;Skill&nbsp;Score
        </label>
        <Input
          id="skillMin"
          type="number"
          min={0}
          max={100}
          placeholder="0 ‑ 100"
          value={skillMin === 0 ? '' : skillMin}
          onChange={(e) => setSkillMin(Number(e.target.value) || 0)}
          className="h-10 w-36"
        />
      </div>

      {/* Verified‑only toggle */}
      <div className="flex items-center gap-2 self-center pt-4">
        <input
          id="verifiedOnly"
          type="checkbox"
          className="size-4 cursor-pointer accent-primary"
          checked={verifiedOnly}
          onChange={(e) => setVerifiedOnly(e.target.checked)}
        />
        <label htmlFor="verifiedOnly" className="cursor-pointer text-sm">
          Verified only
        </label>
      </div>
    </div>
  )
}