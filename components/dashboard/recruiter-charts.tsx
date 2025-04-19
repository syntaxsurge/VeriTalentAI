'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChartWithLegend } from '@/components/ui/pie-chart-with-legend'
import { type ChartConfig } from '@/components/ui/chart'

interface StageDatum {
  stage: string
  count: number
}

interface RecruiterChartsProps {
  stageData: StageDatum[]
  uniqueCandidates: number
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
  borderRadius: 6,
} as const

export default function RecruiterCharts({ stageData, uniqueCandidates }: RecruiterChartsProps) {
  const pieData = [
    { category: 'unique', value: uniqueCandidates },
    { category: 'total', value: stageData.reduce((acc, d) => acc + d.count, 0) },
  ]

  const chartConfig = {
    value: { label: 'Entries' },
    unique: { label: 'Unique Candidates', color: 'var(--color-chart-1)' },
    total: { label: 'Total Entries', color: 'var(--color-chart-2)' },
  } satisfies ChartConfig

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* Bar chart – stage distribution */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Candidates per Stage</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {stageData.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No candidates in pipelines yet.</p>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={stageData}>
                <XAxis dataKey='stage' tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey='count' fill='hsl(var(--color-primary))' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie chart – unique vs total */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Unique vs Total Entries</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {uniqueCandidates === 0 ? (
            <p className='text-muted-foreground text-sm'>No data to display.</p>
          ) : (
            <PieChartWithLegend data={pieData} dataKey='value' nameKey='category' config={chartConfig} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}