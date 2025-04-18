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
/*                        S H A R E D   S T Y L E S                           */
/* -------------------------------------------------------------------------- */

/**
 * Explicit colour mapping for each credential status.
 * Works for both light and dark themes because colours are derived
 * from Tailwind CSS custom properties driven by the theme.
 */
const STATUS_COLOR_MAP: Record<string, string> = {
  VERIFIED: 'hsl(var(--color-success))',      // green
  PENDING: 'hsl(var(--color-warning))',       // amber
  UNVERIFIED: 'hsl(var(--color-destructive))',// red
  REJECTED: 'hsl(var(--color-destructive))',  // red
}

const FALLBACK_COLORS = [
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
/*                              C O M P O N E N T                             */
/* -------------------------------------------------------------------------- */

export default function CandidateCharts({ scoreData, statusData }: CandidateChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Line chart – quiz scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Quiz Scores (last 10)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {scoreData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No quiz attempts yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreData}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--color-primary))"
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
          <CardTitle className="text-lg font-medium">Credential Status Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {statusData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No credentials added yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {statusData.map((d, idx) => {
                    const color =
                      STATUS_COLOR_MAP[d.name?.toUpperCase()] ??
                      FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
                    return <Cell key={idx} fill={color} />
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}