'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChartWithLegend } from '@/components/ui/pie-chart-with-legend'
import { type ChartConfig } from '@/components/ui/chart'

/* -------------------------------------------------------------------------- */
/*                                 T Y P E S                                  */
/* -------------------------------------------------------------------------- */

export interface ScoreDatum {
  date: string
  score: number
}

export interface StatusDatum {
  name: string
  value: number
}

interface CandidateChartsProps {
  scoreData: ScoreDatum[]
  statusData: StatusDatum[]
}

/* -------------------------------------------------------------------------- */
/*                              S H A R E D S T Y L E S                        */
/* -------------------------------------------------------------------------- */

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
  borderRadius: 6,
} as const

/* -------------------------------------------------------------------------- */
/*                              C O M P O N E N T                             */
/* -------------------------------------------------------------------------- */

export default function CandidateCharts({ scoreData, statusData }: CandidateChartsProps) {
  /* Transform for pie‑chart */
  const pieData = statusData.map((d) => ({
    status: d.name.toLowerCase(),
    count: d.value,
  }))

  const chartConfig = {
    count: { label: 'Credentials' },
    verified: { label: 'Verified', color: 'var(--success)' },
    pending: { label: 'Pending', color: 'var(--warning)' },
    unverified: { label: 'Unverified', color: 'var(--color-muted-foreground)' },
    rejected: { label: 'Rejected', color: 'var(--color-destructive)' },
  } satisfies ChartConfig

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* Line chart – quiz scores */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Quiz Scores (last 10)</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {scoreData.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No quiz attempts yet.</p>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={scoreData}>
                <XAxis dataKey='date' />
                <YAxis domain={[0, 100]} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line
                  type='monotone'
                  dataKey='score'
                  stroke='hsl(var(--color-primary))'
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie chart – credential status */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Credential Status Mix</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {pieData.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No credentials added yet.</p>
          ) : (
            <PieChartWithLegend
              data={pieData}
              dataKey='count'
              nameKey='status'
              config={chartConfig}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}