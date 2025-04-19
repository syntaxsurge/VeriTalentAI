'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChartWithLegend } from '@/components/ui/pie-chart-with-legend'
import { BarChartWithBars } from '@/components/ui/bar-chart-with-bars'
import { type ChartConfig } from '@/components/ui/chart'

interface StageDatum {
  stage: string
  count: number
}

interface RecruiterChartsProps {
  stageData: StageDatum[]
  uniqueCandidates: number
}

export default function RecruiterCharts({
  stageData,
  uniqueCandidates,
}: RecruiterChartsProps) {
  /* --------------------- bar‑chart config --------------------- */
  const barConfig = {
    count: { label: 'Candidates', color: 'var(--color-primary)' },
  } satisfies ChartConfig

  /* --------------------- pie‑chart prep ----------------------- */
  const pieData = [
    { category: 'unique', value: uniqueCandidates },
    { category: 'total', value: stageData.reduce((sum, d) => sum + d.count, 0) },
  ]

  const pieConfig = {
    value: { label: 'Entries' },
    unique: { label: 'Unique Candidates', color: 'var(--color-chart-1)' },
    total: { label: 'Total Entries', color: 'var(--color-chart-2)' },
  } satisfies ChartConfig

  /* --------------------------- view --------------------------- */
  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* Bar chart – stage distribution */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Candidates per Stage</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {stageData.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No candidates in pipelines yet.
            </p>
          ) : (
            <BarChartWithBars
              data={stageData}
              xKey='stage'
              yKey='count'
              config={barConfig}
            />
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
            <PieChartWithLegend
              data={pieData}
              dataKey='value'
              nameKey='category'
              config={pieConfig}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}