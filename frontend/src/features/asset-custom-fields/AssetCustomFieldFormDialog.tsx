import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { AssetCustomFieldDefinition, AssetType } from '@/api/types'
import {
  assetCustomFieldFormSchema,
  CUSTOM_FIELD_TYPE_LABELS,
  type AssetCustomFieldFormValues,
} from '@/features/asset-custom-fields/asset-custom-field-schema'

const EMPTY_VALUES: AssetCustomFieldFormValues = {
  asset_type_id: 0,
  name: '',
  field_type: 'text',
  is_required: false,
}

function definitionToFormValues(
  definition: AssetCustomFieldDefinition
): AssetCustomFieldFormValues {
  return {
    asset_type_id: definition.asset_type_id,
    name: definition.name,
    field_type: definition.field_type,
    is_required: definition.is_required,
  }
}

interface AssetCustomFieldFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  definition?: AssetCustomFieldDefinition
  assetTypes: AssetType[] | undefined
  isSubmitting: boolean
  onSubmit: (values: AssetCustomFieldFormValues) => Promise<unknown>
}

export function AssetCustomFieldFormDialog({
  open,
  onOpenChange,
  definition,
  assetTypes,
  isSubmitting,
  onSubmit,
}: AssetCustomFieldFormDialogProps) {
  const isEdit = !!definition

  const form = useForm<AssetCustomFieldFormValues>({
    resolver: zodResolver(assetCustomFieldFormSchema),
    defaultValues: definition ? definitionToFormValues(definition) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(definition ? definitionToFormValues(definition) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition])

  async function handleSubmit(values: AssetCustomFieldFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить поле' : 'Добавить поле'}</DialogTitle>
          <DialogDescription>
            Дополнительное поле будет доступно при создании и редактировании активов выбранного
            типа.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название поля</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Модель процессора" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="field_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип значения</FormLabel>
                  <Select
                    items={CUSTOM_FIELD_TYPE_LABELS}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите тип значения" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CUSTOM_FIELD_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">
                      Тип значения нельзя изменить после создания поля.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_required"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="!m-0">Обязательное поле</FormLabel>
                  </div>
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
                {isEdit ? 'Сохранить изменения' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
