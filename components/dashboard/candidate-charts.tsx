'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChartWithLegend } from '@/components/ui/pie-chart-with-legend'
import { LineChartWithDots } from '@/components/ui/line-chart-with-dots'
import { type ChartConfig } from '@/components/ui/chart'

/* -------------------------------------------------------------------------- */
/*                                   T Y P E S                                */
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
/*                                   V I E W                                  */
/* -------------------------------------------------------------------------- */

export default function CandidateCharts({ scoreData, statusData }: CandidateChartsProps) {
  /* Pie‑chart prep */
  const pieData = statusData.map((d) => ({
    status: d.name.toLowerCase(),
    count: d.value,
  }))

  const pieConfig = {
    count: { label: 'Credentials' },
    verified: { label: 'Verified', color: 'var(--success)' },
    pending: { label: 'Pending', color: 'var(--warning)' },
    unverified: { label: 'Unverified', color: 'var(--color-muted-foreground)' },
    rejected: { label: 'Rejected', color: 'var(--color-destructive)' },
  } satisfies ChartConfig

  /* Line‑chart config */
  const lineConfig = {
    score: { label: 'Score', color: 'var(--chart-1)' },
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
            <LineChartWithDots
              data={scoreData}
              xKey='date'
              yKey='score'
              yDomain={[0, 100]}
              config={lineConfig}
              xTickFormatter={(v) => String(v).slice(5)} /* show MM‑DD */
            />
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
              config={pieConfig}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}