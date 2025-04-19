'use client'

import React from 'react'
import { Pie, PieChart, Cell } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

interface PieChartWithLegendProps<D extends Record<string, any> = any> {
  data: D[]
  dataKey: keyof D
  nameKey: keyof D
  config: ChartConfig
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   U T I L S                                */
/* -------------------------------------------------------------------------- */

/**
 * Picks a colour for a given pie slice.
 * If a `color` is defined in the chart config, use it as‑is.
 * Otherwise fall back to the palette variable `--color-${sliceKey}`.
 */
function sliceColour(sliceKey: string, cfg: ChartConfig): string | undefined {
  const entry = cfg[sliceKey]
  if (!entry) return undefined
  if ('color' in entry && entry.color) return entry.color
  return `var(--color-${sliceKey})`
}

/* -------------------------------------------------------------------------- */
/*                                   V I E W                                  */
/* -------------------------------------------------------------------------- */

export function PieChartWithLegend<D extends Record<string, any> = any>({
  data,
  dataKey,
  nameKey,
  config,
  className,
}: PieChartWithLegendProps<D>) {
  return (
    <ChartContainer
      config={config}
      className={cn(
        'mx-auto aspect-square max-h-[300px] pb-0 [&_.recharts-pie-label-text]:fill-foreground',
        className,
      )}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey={dataKey as string} nameKey={nameKey as string} label>
          {data.map((entry, index) => {
            const key = String(entry[nameKey]).toLowerCase()
            const fill = sliceColour(key, config) ?? '#808080'
            return <Cell key={`cell-${index}`} fill={fill} />
          })}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey={nameKey as string} />}
          className='-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center'
        />
      </PieChart>
    </ChartContainer>
  )
}