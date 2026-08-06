import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal, Plus } from 'lucide-react'

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

import type { TypeFormValues } from '@/features/shared/type-schema'
import { TypeFormDialog } from '@/features/shared/TypeFormDialog'

interface NamedEntity {
  id: number
  name: string
  description: string | null
}

interface NamedEntityInput {
  name: string
  description?: string | null
}

interface Mutation<T> {
  mutateAsync: (input: T) => Promise<unknown>
  mutate: (input: T) => void
  isPending: boolean
}

interface TypeCrudSectionProps<T extends NamedEntity> {
  title: string
  description: string
  icon: LucideIcon
  entityLabel: string
  namePlaceholder: string
  items: T[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  createMutation: Mutation<NamedEntityInput>
  updateMutation: Mutation<{ id: number; data: NamedEntityInput }>
  deleteMutation: Mutation<number>
}

export function TypeCrudSection<T extends NamedEntity>({
  title,
  description,
  icon: Icon,
  entityLabel,
  namePlaceholder,
  items,
  isPending,
  isError,
  error,
  refetch,
  createMutation,
  updateMutation,
  deleteMutation,
}: TypeCrudSectionProps<T>) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<T | undefined>(undefined)
  const [deletingEntity, setDeletingEntity] = useState<T | undefined>(undefined)

  async function handleSubmit(values: TypeFormValues) {
    const payload = { name: values.name, description: values.description || null }
    if (editingEntity) {
      await updateMutation.mutateAsync({ id: editingEntity.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={() => {
            setEditingEntity(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Добавить {entityLabel.toLowerCase()}
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
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title="Список пуст"
          description={`Добавьте первый элемент («${entityLabel.toLowerCase()}»), чтобы начать работу.`}
          action={
            <Button
              onClick={() => {
                setEditingEntity(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Добавить {entityLabel.toLowerCase()}
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
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
                            setEditingEntity(item)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingEntity(item)}
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

      <TypeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingEntity(undefined)
        }}
        entityLabel={entityLabel}
        namePlaceholder={namePlaceholder}
        entity={editingEntity}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingEntity}
        onOpenChange={(open) => !open && setDeletingEntity(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {entityLabel.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              Запись «{deletingEntity?.name}» будет удалена без возможности восстановления. Если{' '}
              {entityLabel.toLowerCase()} всё ещё используется, удаление будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingEntity) deleteMutation.mutate(deletingEntity.id)
                setDeletingEntity(undefined)
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
