import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { StatusBadge } from '@/components/status-badge'

import type { Asset } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { usePlaces } from '@/features/places/hooks'
import { useCreateAsset, useUpdateAsset } from '@/features/assets/hooks'
import { assetFormSchema, type AssetFormValues } from '@/features/assets/asset-schema'

const EMPTY_VALUES: AssetFormValues = {
  asset_type_id: 0,
  name: '',
  inventory_number: '',
  serial_number: '',
  place_id: undefined,
  notes: '',
}

function assetToFormValues(asset: Asset): AssetFormValues {
  return {
    asset_type_id: asset.asset_type_id,
    name: asset.name,
    inventory_number: asset.inventory_number != null ? String(asset.inventory_number) : '',
    serial_number: asset.serial_number ?? '',
    place_id: asset.place_id ?? undefined,
    notes: asset.notes ?? '',
  }
}

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset
}

export function AssetFormDialog({ open, onOpenChange, asset }: AssetFormDialogProps) {
  const isEdit = !!asset
  const { data: assetTypes } = useAssetTypes()
  const { data: places } = usePlaces()
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset ? assetToFormValues(asset) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(asset ? assetToFormValues(asset) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset])

  const isSubmitting = createAsset.isPending || updateAsset.isPending

  async function onSubmit(values: AssetFormValues) {
    const payload = {
      asset_type_id: values.asset_type_id,
      name: values.name || null,
      inventory_number: values.inventory_number ? Number(values.inventory_number) : null,
      serial_number: values.serial_number || null,
      place_id: values.place_id ?? null,
      notes: values.notes || null,
    }

    if (isEdit) {
      await updateAsset.mutateAsync({ id: asset.id, data: payload })
    } else {
      await createAsset.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить актив' : 'Добавить актив'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Обновите данные актива ниже.' : 'Зарегистрируйте новый актив в системе.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Автоматически: серийный номер + тип актива, если оставить пустым"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <div>
                <p className="text-sm font-medium">Статус</p>
                <div className="mt-1">
                  <StatusBadge status={asset.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Статус меняется автоматически по событиям актива.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="asset_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип актива</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      items={(assetTypes ?? []).map((type) => ({
                        value: String(type.id),
                        label: type.name,
                      }))}
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      placeholder="Выберите тип актива"
                      searchPlaceholder="Поиск типа актива..."
                      emptyMessage="Типы активов не найдены"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inventory_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Инвентарный номер</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Автоматически, если оставить пустым"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Серийный номер</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="place_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Место</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      items={(places ?? []).map((place) => ({
                        value: String(place.id),
                        label: place.name,
                      }))}
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      placeholder="Не указано"
                      searchPlaceholder="Поиск места..."
                      emptyMessage="Места не найдены"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && asset.responsible_user ? (
              <div>
                <p className="text-sm font-medium">Ответственное лицо</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {asset.responsible_user.first_name} {asset.responsible_user.last_name}
                  {' — обновится на вас при сохранении'}
                </p>
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечания</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Необязательные примечания" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? 'Сохранить изменения' : 'Создать актив'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
