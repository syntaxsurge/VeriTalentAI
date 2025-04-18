'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
/*                           C O N S T A N T S                                */
/* -------------------------------------------------------------------------- */

const STATUS_COLORS = [
  'hsl(var(--color-chart-1))',
  'hsl(var(--color-chart-2))',
  'hsl(var(--color-chart-3))',
  'hsl(var(--color-chart-4))',
]

/* -------------------------------------------------------------------------- */
/*                              C O M P O N E N T                             */
/* -------------------------------------------------------------------------- */

export default function CandidateCharts({
  scoreData,
  statusData,
}: CandidateChartsProps) {
  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* Line chart – quiz scores */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Quiz Scores (last 10)</CardTitle>
        </CardHeader>
        <CardContent className='h-72'>
          {scoreData.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No quiz attempts yet.
            </p>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={scoreData}>
                <XAxis dataKey='date' />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
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
          {statusData.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No credentials added yet.
            </p>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={statusData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  outerRadius={90}
                  label
                >
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
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