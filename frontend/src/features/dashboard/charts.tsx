import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { AssetsByStatus, AssetsByType, EventsByType, MonthlyActivityPoint } from '@/api/types'

const MAGNITUDE_CONFIG = {
  count: { label: 'Количество', color: 'var(--chart-1)' },
} satisfies ChartConfig

const ACTIVITY_CONFIG = {
  new_assets: { label: 'Новые активы', color: 'var(--chart-1)' },
  events: { label: 'События', color: 'var(--chart-2)' },
} satisfies ChartConfig

const DISPOSALS_CONFIG = {
  disposals: { label: 'Списано', color: 'var(--chart-1)' },
} satisfies ChartConfig

function truncateLabel(value: string, max = 18): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function formatMonthLabel(month: string): string {
  const [yearPart, monthPart] = month.split('-')
  const year = Number(yearPart)
  const monthIndex = Number(monthPart)
  return new Date(year, monthIndex - 1, 1).toLocaleDateString('ru-RU', {
    month: 'short',
    year: '2-digit',
  })
}

function MagnitudeBarChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ChartContainer config={MAGNITUDE_CONFIG} className="aspect-auto h-60 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          tickFormatter={(value: string) => truncateLabel(value)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} barSize={20} />
      </BarChart>
    </ChartContainer>
  )
}

export function AssetsByTypeChart({ data }: { data: AssetsByType[] }) {
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ name: item.asset_type_name, count: item.count }))
  return <MagnitudeBarChart data={chartData} />
}

export function AssetsByStatusChart({ data }: { data: AssetsByStatus[] }) {
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ name: item.status_name, count: item.count }))
  return <MagnitudeBarChart data={chartData} />
}

export function EventsByTypeChart({ data }: { data: EventsByType[] }) {
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ name: item.event_type_name, count: item.count }))
  return <MagnitudeBarChart data={chartData} />
}

export function MonthlyActivityChart({ data }: { data: MonthlyActivityPoint[] }) {
  const chartData = data.map((point) => ({
    label: formatMonthLabel(point.month),
    new_assets: point.new_assets,
    events: point.events,
  }))
  return (
    <ChartContainer config={ACTIVITY_CONFIG} className="aspect-auto h-72 w-full">
      <LineChart data={chartData} margin={{ left: 8, right: 16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="new_assets"
          stroke="var(--color-new_assets)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-new_assets)' }}
        />
        <Line
          type="monotone"
          dataKey="events"
          stroke="var(--color-events)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-events)' }}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function DisposalsChart({ data }: { data: MonthlyActivityPoint[] }) {
  const chartData = data.map((point) => ({
    label: formatMonthLabel(point.month),
    disposals: point.disposals,
  }))
  return (
    <ChartContainer config={DISPOSALS_CONFIG} className="aspect-auto h-60 w-full">
      <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="disposals" fill="var(--color-disposals)" radius={4} barSize={24} />
      </BarChart>
    </ChartContainer>
  )
}
