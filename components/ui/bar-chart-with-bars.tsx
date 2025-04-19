'use client'

import React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface BarChartWithBarsProps<D extends Record<string, any> = any> {
  /** Array of source objects */
  data: D[]
  /** Key for the X‑axis (categorical) */
  xKey: keyof D
  /** Key for the Y‑axis (numeric) */
  yKey: keyof D
  /** Colour / label mapping, same contract as other shadcn helpers */
  config: ChartConfig
  /** Optional formatter for X ticks (default: full label) */
  xTickFormatter?: (value: any) => string
}

/**
 * Vertical bar chart that plugs into the shared shadcn chart framework.
 */
export function BarChartWithBars<D extends Record<string, any> = any>({
  data,
  xKey,
  yKey,
  config,
  xTickFormatter = (v) => String(v),
}: BarChartWithBarsProps<D>) {
  /* Derive bar colour from the config entry matching `yKey` */
  const colourVar = `var(--color-${String(yKey)})`

  return (
    <ChartContainer config={config}>
      <BarChart data={data} margin={{ top: 8, left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={xTickFormatter}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey={yKey as string} fill={colourVar} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}