import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/error-state'

import { useAssetHistoryItem } from '@/features/asset-history/hooks'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

export function AssetHistoryDetailPage() {
  const params = useParams<{ id: string }>()
  const historyId = Number(params.id)
  const navigate = useNavigate()

  const historyQuery = useAssetHistoryItem(historyId)

  if (!Number.isFinite(historyId)) {
    return <ErrorState message="Некорректный идентификатор записи истории." />
  }

  if (historyQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        message={(historyQuery.error as Error).message}
        onRetry={() => historyQuery.refetch()}
      />
    )
  }

  const item = historyQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{item.asset_name}</h2>
            <p className="text-muted-foreground">{item.asset_type_name}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <InfoRow label="Инвентарный номер" value={item.inventory_number ?? '—'} />
            <InfoRow label="Серийный номер" value={item.serial_number ?? '—'} />
            <InfoRow label="Место" value={item.place_name ?? '—'} />
            <InfoRow label="Ответственное лицо" value={item.responsible_person ?? '—'} />
            <InfoRow
              label="Создан"
              value={new Date(item.asset_created_at).toLocaleString()}
            />
            <InfoRow label="Списан" value={new Date(item.disposed_at).toLocaleString()} />
          </dl>
          {item.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-muted-foreground">Примечания</p>
              <p className="mt-1 text-sm">{item.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            История событий
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-6 border-l pl-6">
            {item.events.map((event, index) => (
              <li key={index} className="relative">
                <span className="absolute top-1 -left-[1.6rem] size-2.5 rounded-full bg-primary" />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{event.event_type_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                )}
                {event.performed_by && (
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>Исполнитель: {event.performed_by}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
