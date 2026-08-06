import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { StatusBadge } from '@/components/status-badge'

import type { Asset, AssetEvent } from '@/api/types'
import {
  useAsset,
  useAssetEventCounters,
  useAssetEvents,
  useDeleteAsset,
} from '@/features/assets/hooks'
import { useDeleteAssetEvent } from '@/features/assets/event-hooks'
import { AssetFormDialog } from '@/features/assets/AssetFormDialog'
import { AssetEventFormDialog } from '@/features/assets/AssetEventFormDialog'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

export function AssetDetailPage() {
  const params = useParams<{ id: string }>()
  const assetId = Number(params.id)
  const navigate = useNavigate()

  const [editAssetOpen, setEditAssetOpen] = useState(false)
  const [deleteAssetOpen, setDeleteAssetOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AssetEvent | undefined>(undefined)
  const [deletingEvent, setDeletingEvent] = useState<AssetEvent | undefined>(undefined)

  const assetQuery = useAsset(assetId)
  const eventsQuery = useAssetEvents(assetId)
  const countersQuery = useAssetEventCounters(assetId)
  const deleteAsset = useDeleteAsset()
  const deleteEvent = useDeleteAssetEvent(assetId)

  if (!Number.isFinite(assetId)) {
    return <ErrorState message="Некорректный идентификатор актива." />
  }

  if (assetQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (assetQuery.isError) {
    return (
      <ErrorState
        message={(assetQuery.error as Error).message}
        onRetry={() => assetQuery.refetch()}
      />
    )
  }

  const asset: Asset = assetQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{asset.name}</h2>
            <p className="text-muted-foreground">{asset.asset_type.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditAssetOpen(true)}>
            <Pencil className="size-4" />
            Изменить
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteAssetOpen(true)}
          >
            <Trash2 className="size-4" />
            Удалить
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Статус</dt>
              <dd className="mt-1">
                <StatusBadge status={asset.status} />
              </dd>
            </div>
            <InfoRow label="Инвентарный номер" value={asset.inventory_number ?? '—'} />
            <InfoRow label="Серийный номер" value={asset.serial_number ?? '—'} />
            <InfoRow label="Местоположение" value={asset.location ?? '—'} />
            <InfoRow label="Ответственное лицо" value={asset.responsible_person ?? '—'} />
            <InfoRow
              label="Создан"
              value={new Date(asset.created_at).toLocaleDateString()}
            />
            <InfoRow
              label="Последнее обновление"
              value={new Date(asset.updated_at).toLocaleDateString()}
            />
          </dl>
          {asset.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-muted-foreground">Примечания</p>
              <p className="mt-1 text-sm">{asset.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!!countersQuery.data?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Счётчики событий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {countersQuery.data.map((counter) => (
                <span
                  key={counter.event_type_id}
                  className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                >
                  {counter.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            История событий
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingEvent(undefined)
              setEventDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Добавить событие
          </Button>
        </CardHeader>
        <CardContent>
          {eventsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : eventsQuery.isError ? (
            <ErrorState
              message={(eventsQuery.error as Error).message}
              onRetry={() => eventsQuery.refetch()}
            />
          ) : eventsQuery.data.length === 0 ? (
            <EmptyState
              icon={History}
              title="Событий пока нет"
              description="Добавьте первое событие, чтобы начать историю этого актива."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingEvent(undefined)
                    setEventDialogOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  Добавить событие
                </Button>
              }
            />
          ) : (
            <ol className="relative space-y-6 border-l pl-6">
              {eventsQuery.data.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute top-1 -left-[1.6rem] size-2.5 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{event.event_type.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleString()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingEvent(event)
                            setEventDialogOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingEvent(event)}
                        >
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          )}
        </CardContent>
      </Card>

      <AssetFormDialog open={editAssetOpen} onOpenChange={setEditAssetOpen} asset={asset} />

      <AssetEventFormDialog
        assetId={assetId}
        open={eventDialogOpen}
        onOpenChange={(open) => {
          setEventDialogOpen(open)
          if (!open) setEditingEvent(undefined)
        }}
        event={editingEvent}
      />

      <AlertDialog open={deleteAssetOpen} onOpenChange={setDeleteAssetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить актив?</AlertDialogTitle>
            <AlertDialogDescription>
              Актив «{asset.name}» и вся история его событий будут удалены без возможности
              восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAsset.mutate(asset.id, {
                  onSuccess: () => navigate('/assets'),
                })
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить событие?</AlertDialogTitle>
            <AlertDialogDescription>
              Это событие будет удалено из истории актива без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingEvent) deleteEvent.mutate(deletingEvent.id)
                setDeletingEvent(undefined)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
