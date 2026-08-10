import { useEffect, useMemo, useState } from 'react'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { useAssetTypes } from '@/features/asset-types/hooks'
import { useEventTypes } from '@/features/event-types/hooks'
import { useBulkCreateEvents } from '@/features/assets/event-hooks'
import { useSettings } from '@/features/settings/hooks'
import {
  bulkEventFormSchema,
  type BulkEventFormValues,
} from '@/features/assets/bulk-event-schema'
import { nowLocalIso } from '@/lib/datetime'

const DEFAULT_SEPARATOR = '\n'

const SEPARATOR_PRESETS: { value: string; label: string; separator: string }[] = [
  { value: 'newline', label: 'Перевод строки', separator: '\n' },
  { value: 'comma', label: 'Запятая', separator: ',' },
  { value: 'semicolon', label: 'Точка с запятой', separator: ';' },
  { value: 'space', label: 'Пробел', separator: ' ' },
  { value: 'custom', label: 'Другой', separator: '' },
]

function presetForSeparator(separator: string): string {
  const preset = SEPARATOR_PRESETS.find((p) => p.value !== 'custom' && p.separator === separator)
  return preset?.value ?? 'custom'
}

interface BulkEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkEventDialog({ open, onOpenChange }: BulkEventDialogProps) {
  const { data: eventTypes } = useEventTypes()
  const { data: assetTypes } = useAssetTypes()
  const { data: settings } = useSettings()
  const bulkCreate = useBulkCreateEvents()

  const [separatorPreset, setSeparatorPreset] = useState('newline')
  const [customSeparator, setCustomSeparator] = useState('')
  const [notFound, setNotFound] = useState<string[]>([])

  const form = useForm<BulkEventFormValues>({
    resolver: zodResolver(bulkEventFormSchema),
    defaultValues: {
      event_type_id: 0,
      asset_type_id: 0,
      event_date: nowLocalIso(),
      description: '',
      separator: DEFAULT_SEPARATOR,
      raw_text: '',
    },
  })

  useEffect(() => {
    if (!open) return
    const separator = settings?.default_bulk_event_separator || DEFAULT_SEPARATOR
    form.reset({
      event_type_id: 0,
      asset_type_id: 0,
      event_date: nowLocalIso(),
      description: '',
      separator,
      raw_text: '',
    })
    const preset = presetForSeparator(separator)
    setSeparatorPreset(preset)
    setCustomSeparator(preset === 'custom' ? separator : '')
    setNotFound([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings])

  function applySeparatorPreset(preset: string | null) {
    if (!preset) return
    setSeparatorPreset(preset)
    if (preset === 'custom') {
      form.setValue('separator', customSeparator)
    } else {
      const found = SEPARATOR_PRESETS.find((p) => p.value === preset)
      form.setValue('separator', found?.separator ?? DEFAULT_SEPARATOR)
    }
  }

  function applyCustomSeparator(value: string) {
    setCustomSeparator(value)
    form.setValue('separator', value)
  }

  const rawText = form.watch('raw_text')
  const separator = form.watch('separator')

  const inventoryNumbers = useMemo(() => {
    if (!separator) return []
    const values = rawText
      .split(separator)
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
    return [...new Set(values)]
  }, [rawText, separator])

  const selectedEventType = eventTypes?.find((t) => t.id === form.watch('event_type_id'))

  async function onSubmit(values: BulkEventFormValues) {
    const result = await bulkCreate.mutateAsync({
      event_type_id: values.event_type_id,
      asset_type_id: values.asset_type_id,
      event_date: values.event_date,
      description: values.description || null,
      inventory_numbers: inventoryNumbers,
    })

    setNotFound(result.errors.map((e) => e.inventory_number))
    if (result.errors.length === 0) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Массовое добавление событий</DialogTitle>
          <DialogDescription>
            Укажите тип события и параметры один раз, затем вставьте инвентарные номера активов.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="event_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип события</FormLabel>
                  <Select
                    items={Object.fromEntries(
                      (eventTypes ?? []).map((type) => [String(type.id), type.name])
                    )}
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите тип события" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes?.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEventType?.target_status.is_disposal && (
                    <FormDescription>
                      Списанные активы будут перемещены в Историю.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>
                    Инвентарные номера уникальны только в пределах одного типа актива.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата и время</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Необязательные детали" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Разделитель</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Select
                  items={Object.fromEntries(SEPARATOR_PRESETS.map((p) => [p.value, p.label]))}
                  value={separatorPreset}
                  onValueChange={applySeparatorPreset}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEPARATOR_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {separatorPreset === 'custom' && (
                  <Input
                    className="w-24"
                    placeholder="Символ"
                    value={customSeparator}
                    onChange={(e) => applyCustomSeparator(e.target.value)}
                  />
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="raw_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Инвентарные номера</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder={'INV-1001\nINV-1002\nINV-1003'} {...field} />
                  </FormControl>
                  <FormDescription>Найдено номеров: {inventoryNumbers.length}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {notFound.length > 0 && (
              <p className="text-sm text-destructive">
                Не найдены: {notFound.join(', ')}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={bulkCreate.isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={bulkCreate.isPending}>
                Добавить события
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
