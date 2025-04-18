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

interface IssuerChartsProps {
  pending: number
  verified: number
}

const STATUS_COLORS = [
  'hsl(var(--color-warning))', // pending – amber
  'hsl(var(--color-success))', // verified – green
]

export default function IssuerCharts({ pending, verified }: IssuerChartsProps) {
  const data = [
    { name: 'Pending', value: pending },
    { name: 'Verified', value: verified },
  ]

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    borderRadius: 6,
  } as const

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Request Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {pending + verified === 0 ? (
          <p className="text-muted-foreground text-sm">No requests yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'hsl(var(--foreground))' }} />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={STATUS_COLORS[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}