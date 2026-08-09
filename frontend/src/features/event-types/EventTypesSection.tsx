import { useState } from 'react'
import { ListTree, MoreHorizontal, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { StatusBadge } from '@/components/status-badge'

import type { EventType } from '@/api/types'
import {
  useCreateEventType,
  useDeleteEventType,
  useEventTypes,
  useUpdateEventType,
} from '@/features/event-types/hooks'
import { EventTypeFormDialog } from '@/features/event-types/EventTypeFormDialog'
import type { EventTypeFormValues } from '@/features/event-types/event-type-schema'

export function EventTypesSection() {
  const { data, isPending, isError, error, refetch } = useEventTypes()
  const createMutation = useCreateEventType()
  const updateMutation = useUpdateEventType()
  const deleteMutation = useDeleteEventType()

  const [formOpen, setFormOpen] = useState(false)
  const [editingEventType, setEditingEventType] = useState<EventType | undefined>(undefined)
  const [deletingEventType, setDeletingEventType] = useState<EventType | undefined>(undefined)

  async function handleSubmit(values: EventTypeFormValues) {
    const payload = {
      name: values.name,
      description: values.description || null,
      target_status_id: values.target_status_id,
      counter_label: values.counter_label || null,
    }
    if (editingEventType) {
      await updateMutation.mutateAsync({ id: editingEventType.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Типы событий</h2>
          <p className="text-muted-foreground">
            Управляйте видами событий и статусом, который они присваивают активу.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEventType(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Добавить тип события
        </Button>
      </div>

      {isError ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title="Список пуст"
          description="Добавьте первый тип события, чтобы начать работу."
          action={
            <Button
              onClick={() => {
                setEditingEventType(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Добавить тип события
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус актива</TableHead>
                <TableHead>Текст счётчика</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.target_status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.counter_label ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.description ?? '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingEventType(item)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingEventType(item)}
                        >
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EventTypeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingEventType(undefined)
        }}
        eventType={editingEventType}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingEventType}
        onOpenChange={(open) => !open && setDeletingEventType(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тип события?</AlertDialogTitle>
            <AlertDialogDescription>
              Тип события «{deletingEventType?.name}» будет удалён без возможности
              восстановления. Если тип всё ещё используется, удаление будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingEventType) deleteMutation.mutate(deletingEventType.id)
                setDeletingEventType(undefined)
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
