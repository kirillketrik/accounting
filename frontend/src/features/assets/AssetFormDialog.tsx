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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { StatusBadge } from '@/components/status-badge'

import type { Asset } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { useCreateAsset, useUpdateAsset } from '@/features/assets/hooks'
import { assetFormSchema, type AssetFormValues } from '@/features/assets/asset-schema'

const EMPTY_VALUES: AssetFormValues = {
  asset_type_id: 0,
  name: '',
  inventory_number: '',
  serial_number: '',
  location: '',
  responsible_person: '',
  notes: '',
}

function assetToFormValues(asset: Asset): AssetFormValues {
  return {
    asset_type_id: asset.asset_type_id,
    name: asset.name,
    inventory_number: asset.inventory_number ?? '',
    serial_number: asset.serial_number ?? '',
    location: asset.location ?? '',
    responsible_person: asset.responsible_person ?? '',
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
      inventory_number: values.inventory_number || null,
      serial_number: values.serial_number || null,
      location: values.location || null,
      responsible_person: values.responsible_person || null,
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
                  <Select
                    items={Object.fromEntries(
                      (assetTypes ?? []).map((type) => [String(type.id), type.name])
                    )}
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип актива" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetTypes?.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Input placeholder="INV-1001" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Местоположение</FormLabel>
                    <FormControl>
                      <Input placeholder="2 этаж - Бухгалтерия" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsible_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ответственное лицо</FormLabel>
                    <FormControl>
                      <Input placeholder="Иванова Дана" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
