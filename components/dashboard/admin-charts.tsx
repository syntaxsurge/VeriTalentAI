'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChartWithLegend } from '@/components/ui/pie-chart-with-legend'
import { type ChartConfig } from '@/components/ui/chart'

/* -------------------------------------------------------------------------- */
/*                                   T Y P E S                                */
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

/* -------------------------------------------------------------------------- */
/*                        U T I L – dynamic colour map                         */
/* -------------------------------------------------------------------------- */

function buildConfig(title: string, data: Datum[]): ChartConfig {
  const palette = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ]
  const cfg: any = { value: { label: title } }
  data.forEach((d, i) => {
    cfg[d.name.toLowerCase()] = { label: d.name, color: palette[i % palette.length] }
  })
  return cfg as ChartConfig
}

/* -------------------------------------------------------------------------- */
/*                                   V I E W                                  */
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
      {charts.map(({ title, data }) => {
        const pieData = data.map((d) => ({
          category: d.name.toLowerCase(),
          value: d.value,
        }))
        const config = buildConfig(title, data)
        return (
          <Card key={title}>
            <CardHeader>
              <CardTitle className='text-lg font-medium'>{title}</CardTitle>
            </CardHeader>
            <CardContent className='h-72'>
              {pieData.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No data.</p>
              ) : (
                <PieChartWithLegend
                  data={pieData}
                  dataKey='value'
                  nameKey='category'
                  config={config}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}