'use client'

import * as React from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface LineChartWithDotsProps<D extends Record<string, any> = any> {
  /** Source array for the graph */
  data: D[]
  /** Key for the X axis (string values recommended) */
  xKey: keyof D
  /** Key for the Y axis (numeric) */
  yKey: keyof D
  /** Optional fixed domain, e.g. [0, 100] */
  yDomain?: [number, number]
  /** Colour / label mapping, same contract as other shadcn chart helpers */
  config: ChartConfig
  /** Custom tick formatter for X axis (default: first 3 chars) */
  xTickFormatter?: (value: any) => string
}

/**
 * Thin wrapper around Recharts <LineChart> that plugs seamlessly into the existing
 * shadcn ChartContainer / tooltip system and uses CSS variables for theming.
 */
export function LineChartWithDots<D extends Record<string, any> = any>({
  data,
  xKey,
  yKey,
  yDomain,
  config,
  xTickFormatter = (v) => String(v).slice(0, 3),
}: LineChartWithDotsProps<D>) {
  /* Derive colour from `config` so consumers don’t have to pass it twice */
  const colourVar = `var(--color-${String(yKey)})`

  return (
    <ChartContainer config={config}>
      <LineChart
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={xTickFormatter}
        />
        <YAxis
          domain={yDomain}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Line
          dataKey={yKey as string}
          type='natural'
          stroke={colourVar}
          strokeWidth={2}
          dot={{ fill: colourVar }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}