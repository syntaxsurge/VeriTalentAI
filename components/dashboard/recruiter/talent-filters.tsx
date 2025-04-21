'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Slider } from '@/components/ui/slider'

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
        <label htmlFor="skillMin" className="mb-2 text-sm font-medium">
          Min&nbsp;Skill&nbsp;Score&nbsp;({skillMin})
        </label>
        <Slider
          id="skillMin"
          min={0}
          max={100}
          step={1}
          value={[skillMin]}
          onValueChange={(v) => setSkillMin(v[0] ?? 0)}
          className="w-48"
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
          Verified&nbsp;only
        </label>
      </div>
    </div>
  )
}