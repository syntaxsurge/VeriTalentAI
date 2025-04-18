'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StageDatum {
  stage: string
  count: number
}

interface RecruiterChartsProps {
  stageData: StageDatum[]
  uniqueCandidates: number
}

const COLORS = [
  'hsl(var(--color-chart-1))',
  'hsl(var(--color-chart-2))',
  'hsl(var(--color-chart-3))',
  'hsl(var(--color-chart-4))',
]

export default function RecruiterCharts({
  stageData,
  uniqueCandidates,
}: RecruiterChartsProps) {
  const pieData = [
    { name: 'Unique Candidates', value: uniqueCandidates },
    {
      name: 'Total Pipeline Entries',
      value: stageData.reduce((acc, d) => acc + d.count, 0),
    },
  ]

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
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={stageData}>
                <XAxis dataKey='stage' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey='count'
                  fill='hsl(var(--color-primary))'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie chart – unique vs total */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Unique vs Total Entries</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {uniqueCandidates === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No data to display.
            </p>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={pieData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  outerRadius={90}
                  label
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}