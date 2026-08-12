import { Link } from 'react-router-dom'
import { Archive, Boxes, History, Tag, TrendingUp, Wrench } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { useDashboardSummary } from '@/features/dashboard/hooks'
import {
  AssetsByStatusChart,
  AssetsByTypeChart,
  DisposalsChart,
  EventsByTypeChart,
  MonthlyActivityChart,
} from '@/features/dashboard/charts'

function StatCard({
  title,
  value,
  icon: Icon,
  isPending,
}: {
  title: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  isPending: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  icon: Icon,
  isPending,
  isEmpty,
  emptyDescription,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  isPending: boolean
  isEmpty: boolean
  emptyDescription: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-60 w-full" />
        ) : isEmpty ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{emptyDescription}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useDashboardSummary()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Дашборд</h2>
          <p className="text-muted-foreground">Обзор активов вашей организации.</p>
        </div>
      </div>

      {isError && (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      )}

      {!isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Всего активов"
              value={data?.total_assets}
              icon={Boxes}
              isPending={isPending}
            />
            <StatCard
              title="Всего событий"
              value={data?.total_events}
              icon={Wrench}
              isPending={isPending}
            />
            <StatCard
              title="Списано активов"
              value={data?.total_disposals}
              icon={Archive}
              isPending={isPending}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Активы по типу"
              icon={Tag}
              isPending={isPending}
              isEmpty={!data || data.assets_by_type.length === 0}
              emptyDescription="Активов пока нет."
            >
              {data && <AssetsByTypeChart data={data.assets_by_type} />}
            </ChartCard>

            <ChartCard
              title="Активы по статусу"
              icon={Boxes}
              isPending={isPending}
              isEmpty={!data || data.assets_by_status.length === 0}
              emptyDescription="Активов пока нет."
            >
              {data && <AssetsByStatusChart data={data.assets_by_status} />}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="События по типу"
              icon={Wrench}
              isPending={isPending}
              isEmpty={!data || data.events_by_type.length === 0}
              emptyDescription="События ещё не зафиксированы."
            >
              {data && <EventsByTypeChart data={data.events_by_type} />}
            </ChartCard>

            <ChartCard
              title="Списания по месяцам"
              icon={Archive}
              isPending={isPending}
              isEmpty={!data || data.monthly_activity.every((point) => point.disposals === 0)}
              emptyDescription="Списаний за последние 12 месяцев не было."
            >
              {data && <DisposalsChart data={data.monthly_activity} />}
            </ChartCard>
          </div>

          <ChartCard
            title="Активность за последние 12 месяцев"
            icon={TrendingUp}
            isPending={isPending}
            isEmpty={
              !data || data.monthly_activity.every((p) => p.new_assets === 0 && p.events === 0)
            }
            emptyDescription="Активности за последние 12 месяцев не зафиксировано."
          >
            {data && <MonthlyActivityChart data={data.monthly_activity} />}
          </ChartCard>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Последние события</CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : data && data.latest_events.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="События ещё не зафиксированы"
                  description="События будут отображаться здесь по мере их регистрации для активов."
                />
              ) : (
                <ul className="divide-y">
                  {data?.latest_events.map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <div>
                        <Link
                          to={`/assets/${event.asset_id}`}
                          className="font-medium hover:underline"
                        >
                          {event.asset_name}
                        </Link>
                        <span className="text-muted-foreground"> — {event.event_type_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {event.performed_by_user && (
                          <span>
                            {event.performed_by_user.first_name}{' '}
                            {event.performed_by_user.last_name}
                          </span>
                        )}
                        <span>{new Date(event.event_date).toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
