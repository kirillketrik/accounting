import { useState } from 'react'
import { MoreHorizontal, Plus, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

import type { AssetCustomFieldDefinition } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import {
  useAssetCustomFieldDefinitions,
  useCreateAssetCustomFieldDefinition,
  useDeleteAssetCustomFieldDefinition,
  useUpdateAssetCustomFieldDefinition,
} from '@/features/asset-custom-fields/hooks'
import { AssetCustomFieldFormDialog } from '@/features/asset-custom-fields/AssetCustomFieldFormDialog'
import {
  CUSTOM_FIELD_TYPE_LABELS,
  type AssetCustomFieldFormValues,
} from '@/features/asset-custom-fields/asset-custom-field-schema'

export function AssetCustomFieldsSection() {
  const { data: assetTypes } = useAssetTypes()
  const { data, isPending, isError, error, refetch } = useAssetCustomFieldDefinitions()
  const createMutation = useCreateAssetCustomFieldDefinition()
  const updateMutation = useUpdateAssetCustomFieldDefinition()
  const deleteMutation = useDeleteAssetCustomFieldDefinition()

  const [formOpen, setFormOpen] = useState(false)
  const [editingDefinition, setEditingDefinition] = useState<
    AssetCustomFieldDefinition | undefined
  >(undefined)
  const [deletingDefinition, setDeletingDefinition] = useState<
    AssetCustomFieldDefinition | undefined
  >(undefined)

  const assetTypeById = new Map((assetTypes ?? []).map((type) => [type.id, type.name]))

  async function handleSubmit(values: AssetCustomFieldFormValues) {
    if (editingDefinition) {
      await updateMutation.mutateAsync({
        id: editingDefinition.id,
        data: { name: values.name, is_required: values.is_required },
      })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Дополнительные поля</h2>
          <p className="text-muted-foreground">
            Настраиваемые атрибуты, привязанные к типу актива (например, модель процессора для
            компьютеров).
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDefinition(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Добавить поле
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
          icon={SlidersHorizontal}
          title="Список пуст"
          description="Добавьте первое дополнительное поле, чтобы указывать особые характеристики активов."
          action={
            <Button
              onClick={() => {
                setEditingDefinition(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Добавить поле
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип актива</TableHead>
                <TableHead>Тип значения</TableHead>
                <TableHead>Обязательное</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((definition) => (
                <TableRow key={definition.id}>
                  <TableCell className="font-medium">{definition.name}</TableCell>
                  <TableCell>{assetTypeById.get(definition.asset_type_id) ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {CUSTOM_FIELD_TYPE_LABELS[definition.field_type]}
                  </TableCell>
                  <TableCell>
                    {definition.is_required ? (
                      <Badge variant="secondary">Обязательное</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingDefinition(definition)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingDefinition(definition)}
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

      <AssetCustomFieldFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingDefinition(undefined)
        }}
        definition={editingDefinition}
        assetTypes={assetTypes}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingDefinition}
        onOpenChange={(open) => !open && setDeletingDefinition(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить поле?</AlertDialogTitle>
            <AlertDialogDescription>
              Поле «{deletingDefinition?.name}» и все его значения на активах будут удалены без
              возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDefinition) deleteMutation.mutate(deletingDefinition.id)
                setDeletingDefinition(undefined)
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
