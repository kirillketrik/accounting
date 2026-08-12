import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

import type { Asset, AssetCustomFieldDefinition, CustomFieldValue } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { usePlaces } from '@/features/places/hooks'
import { useCreateAsset, useUpdateAsset } from '@/features/assets/hooks'
import { useAssetCustomFieldDefinitionsForType } from '@/features/asset-custom-fields/hooks'
import { assetFormSchema, type AssetFormValues } from '@/features/assets/asset-schema'

const EMPTY_VALUES: AssetFormValues = {
  asset_type_id: 0,
  name: '',
  inventory_number: '',
  serial_number: '',
  place_id: undefined,
  notes: '',
  custom_field_values: [],
}

function defaultCustomFieldValue(definition: AssetCustomFieldDefinition): string | boolean {
  return definition.field_type === 'boolean' ? false : ''
}

function assetToFormValues(asset: Asset): AssetFormValues {
  return {
    asset_type_id: asset.asset_type_id,
    name: asset.name,
    inventory_number: asset.inventory_number != null ? String(asset.inventory_number) : '',
    serial_number: asset.serial_number ?? '',
    place_id: asset.place_id ?? undefined,
    notes: asset.notes ?? '',
    custom_field_values: asset.custom_field_values.map((v) => ({
      definition_id: v.definition_id,
      value: typeof v.value === 'boolean' ? v.value : (v.value?.toString() ?? ''),
    })),
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

  const watchedAssetTypeId = useWatch({ control: form.control, name: 'asset_type_id' })
  const { data: customFieldDefinitions } = useAssetCustomFieldDefinitionsForType(
    watchedAssetTypeId || undefined
  )

  // Rebuilds custom_field_values to match the currently selected asset type's
  // definitions whenever they change (initial load, or the user switching
  // asset_type_id mid-form) — preserving already-entered values for definitions
  // still present, defaulting the rest, and dropping stale ones from a prior type.
  useEffect(() => {
    if (!customFieldDefinitions) return
    const existing = new Map(
      form.getValues('custom_field_values').map((v) => [v.definition_id, v.value])
    )
    form.setValue(
      'custom_field_values',
      customFieldDefinitions.map((definition) => ({
        definition_id: definition.id,
        value: existing.get(definition.id) ?? defaultCustomFieldValue(definition),
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFieldDefinitions])

  const isSubmitting = createAsset.isPending || updateAsset.isPending

  async function onSubmit(values: AssetFormValues) {
    try {
      const definitions = customFieldDefinitions ?? []
      let hasRequiredError = false
      values.custom_field_values.forEach((entry, index) => {
        const definition = definitions.find((d) => d.id === entry.definition_id)
        if (!definition?.is_required) return
        if (entry.value === '' || entry.value == null) {
          form.setError(`custom_field_values.${index}.value`, {
            message: `Заполните поле «${definition.name}»`,
          })
          hasRequiredError = true
        }
      })
      if (hasRequiredError) return

      const payload = {
        asset_type_id: values.asset_type_id,
        name: values.name || null,
        inventory_number: values.inventory_number ? Number(values.inventory_number) : null,
        serial_number: values.serial_number || null,
        place_id: values.place_id ?? null,
        notes: values.notes || null,
        custom_field_values: values.custom_field_values.map((entry) => ({
          definition_id: entry.definition_id,
          value: (entry.value === '' || entry.value == null
            ? null
            : entry.value) as CustomFieldValue,
        })),
      }

      if (isEdit) {
        await updateAsset.mutateAsync({ id: asset.id, data: payload })
      } else {
        await createAsset.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (error) {
      // Mutation failures already toast via useCreateAsset/useUpdateAsset's onError;
      // this catches bugs in the block above so a submit attempt can never fail
      // completely silently (no request, no visible feedback).
      console.error('Asset form submit failed', error)
    }
  }

  function onInvalid(errors: Record<string, unknown>) {
    console.error('Asset form validation failed', errors)
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
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
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

            {!!customFieldDefinitions?.length && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium">Дополнительные поля</p>
                {customFieldDefinitions.map((definition, index) => (
                  <FormField
                    key={definition.id}
                    control={form.control}
                    name={`custom_field_values.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {definition.name}
                          {definition.is_required && (
                            <span className="text-destructive"> *</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          {definition.field_type === 'boolean' ? (
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                          ) : (
                            <Input
                              type={definition.field_type === 'date' ? 'date' : 'text'}
                              inputMode={definition.field_type === 'number' ? 'decimal' : undefined}
                              value={typeof field.value === 'string' ? field.value : ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

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
