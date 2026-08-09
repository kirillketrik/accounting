import { useState } from 'react'
import { Flag, MoreHorizontal, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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

import type { AssetStatus } from '@/api/types'
import {
  useAssetStatuses,
  useCreateAssetStatus,
  useDeleteAssetStatus,
  useUpdateAssetStatus,
} from '@/features/asset-statuses/hooks'
import { AssetStatusFormDialog } from '@/features/asset-statuses/AssetStatusFormDialog'
import type { AssetStatusFormValues } from '@/features/asset-statuses/asset-status-schema'

export function AssetStatusesSection() {
  const { data, isPending, isError, error, refetch } = useAssetStatuses()
  const createMutation = useCreateAssetStatus()
  const updateMutation = useUpdateAssetStatus()
  const deleteMutation = useDeleteAssetStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<AssetStatus | undefined>(undefined)
  const [deletingStatus, setDeletingStatus] = useState<AssetStatus | undefined>(undefined)

  async function handleSubmit(values: AssetStatusFormValues) {
    const payload = {
      name: values.name,
      description: values.description || null,
      is_default: values.is_default,
      is_disposal: values.is_disposal,
    }
    if (editingStatus) {
      await updateMutation.mutateAsync({ id: editingStatus.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Статусы активов</h2>
          <p className="text-muted-foreground">
            Управляйте статусами, которые могут присваиваться активам.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingStatus(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Добавить статус
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
          icon={Flag}
          title="Список пуст"
          description="Добавьте первый статус, чтобы начать работу."
          action={
            <Button
              onClick={() => {
                setEditingStatus(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Добавить статус
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>По умолчанию</TableHead>
                <TableHead>Списание</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.is_default && <Badge variant="secondary">По умолчанию</Badge>}
                  </TableCell>
                  <TableCell>
                    {item.is_disposal && <Badge variant="secondary">Списание</Badge>}
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
                            setEditingStatus(item)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingStatus(item)}
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

      <AssetStatusFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingStatus(undefined)
        }}
        status={editingStatus}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingStatus}
        onOpenChange={(open) => !open && setDeletingStatus(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статус?</AlertDialogTitle>
            <AlertDialogDescription>
              Статус «{deletingStatus?.name}» будет удалён без возможности восстановления. Если
              статус всё ещё используется активами или типами событий, удаление будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStatus) deleteMutation.mutate(deletingStatus.id)
                setDeletingStatus(undefined)
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
