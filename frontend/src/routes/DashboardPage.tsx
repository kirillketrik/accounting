import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Boxes, Download, History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { useDashboardSummary } from '@/features/dashboard/hooks'
import { ExportAssetsDialog } from '@/features/export/ExportAssetsDialog'

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useDashboardSummary()
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Дашборд</h2>
          <p className="text-muted-foreground">Обзор активов вашей организации.</p>
        </div>
        <Button variant="outline" onClick={() => setExportOpen(true)}>
          <Download className="size-4" />
          Экспорт активов
        </Button>
      </div>

      <ExportAssetsDialog open={exportOpen} onOpenChange={setExportOpen} />

      {isError && (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      )}

      {!isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Всего активов
                </CardTitle>
                <Boxes className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{data.total_assets}</div>
                )}
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Активы по статусу
                </CardTitle>
                <Activity className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ) : data.assets_by_status.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Активов пока нет.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.assets_by_status.map((entry) => (
                      <Badge key={entry.status_id} variant="secondary" className="text-sm">
                        {entry.status_name}: {entry.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
              ) : data.latest_events.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="События ещё не зафиксированы"
                  description="События будут отображаться здесь по мере их регистрации для активов."
                />
              ) : (
                <ul className="divide-y">
                  {data.latest_events.map((event) => (
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
