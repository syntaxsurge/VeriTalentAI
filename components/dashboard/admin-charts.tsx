'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
export interface Datum {
  name: string
  value: number
}

interface AdminChartsProps {
  usersData: Datum[]
  issuerData: Datum[]
  credentialData: Datum[]
}

/* Shared colours (fallback) */
const COLORS = [
  'hsl(var(--color-chart-1))',
  'hsl(var(--color-chart-2))',
  'hsl(var(--color-chart-3))',
  'hsl(var(--color-chart-4))',
]

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
  borderRadius: 6,
} as const

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */
export default function AdminCharts({
  usersData,
  issuerData,
  credentialData,
}: AdminChartsProps) {
  const charts = [
    { title: 'Users by Role', data: usersData },
    { title: 'Issuer Status', data: issuerData },
    { title: 'Credential Status', data: credentialData },
  ]

  return (
    <div className='grid gap-6 lg:grid-cols-3 md:grid-cols-2'>
      {charts.map(({ title, data }) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className='text-lg font-medium'>{title}</CardTitle>
          </CardHeader>
          <CardContent className='h-72'>
            {data.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No data.</p>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Pie
                    data={data}
                    dataKey='value'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    outerRadius={90}
                    label
                  >
                    {data.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}