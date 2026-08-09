import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useAssetTypes } from '@/features/asset-types/hooks'
import { useBulkCreateAssets } from '@/features/assets/hooks'
import { useSettings } from '@/features/settings/hooks'
import {
  bulkAssetFormSchema,
  type BulkAssetFormValues,
} from '@/features/assets/bulk-asset-schema'
import { parseAssetLine, parseTemplate } from '@/features/assets/bulk-parse'

const DEFAULT_TEMPLATE = '{name} {inventory} {serial}'
const DEFAULT_SEPARATOR = ' '

const SEPARATOR_PRESETS: { value: string; label: string; separator: string }[] = [
  { value: 'space', label: 'Пробел', separator: ' ' },
  { value: 'tab', label: 'Табуляция', separator: '\t' },
  { value: 'comma', label: 'Запятая', separator: ',' },
  { value: 'semicolon', label: 'Точка с запятой', separator: ';' },
  { value: 'custom', label: 'Другой', separator: '' },
]

function presetForSeparator(separator: string): string {
  const preset = SEPARATOR_PRESETS.find((p) => p.value !== 'custom' && p.separator === separator)
  return preset?.value ?? 'custom'
}

interface BulkAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkAssetDialog({ open, onOpenChange }: BulkAssetDialogProps) {
  const { data: assetTypes } = useAssetTypes()
  const { data: settings } = useSettings()
  const bulkCreate = useBulkCreateAssets()

  const [separatorPreset, setSeparatorPreset] = useState('space')
  const [customSeparator, setCustomSeparator] = useState('')

  const form = useForm<BulkAssetFormValues>({
    resolver: zodResolver(bulkAssetFormSchema),
    defaultValues: {
      asset_type_id: 0,
      template: DEFAULT_TEMPLATE,
      separator: DEFAULT_SEPARATOR,
      raw_text: '',
    },
  })

  useEffect(() => {
    if (!open) return
    const separator = settings?.default_bulk_asset_separator || DEFAULT_SEPARATOR
    form.reset({
      asset_type_id: settings?.default_asset_type_id ?? 0,
      template: settings?.default_bulk_asset_template || DEFAULT_TEMPLATE,
      separator,
      raw_text: '',
    })
    const preset = presetForSeparator(separator)
    setSeparatorPreset(preset)
    setCustomSeparator(preset === 'custom' ? separator : '')
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

  const template = form.watch('template')
  const separator = form.watch('separator')
  const rawText = form.watch('raw_text')

  const parsedTemplate = useMemo(
    () => parseTemplate(template, separator),
    [template, separator]
  )

  const lines = useMemo(
    () => rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0),
    [rawText]
  )

  const previewRows = useMemo(() => {
    if (parsedTemplate.error || lines.length === 0) return []
    return lines.map((line) => parseAssetLine(line, parsedTemplate.fields, separator))
  }, [lines, parsedTemplate, separator])

  async function onSubmit(values: BulkAssetFormValues) {
    if (parsedTemplate.error) return

    const items = lines.map((line) => {
      const parsed = parseAssetLine(line, parsedTemplate.fields, values.separator)
      return {
        name: parsed.name || undefined,
        inventory_number: parsed.inventory_number || undefined,
        serial_number: parsed.serial_number || undefined,
      }
    })

    const result = await bulkCreate.mutateAsync({
      asset_type_id: values.asset_type_id,
      items,
    })

    if (result.errors.length === 0) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Массовое добавление активов</DialogTitle>
          <DialogDescription>
            Выберите тип актива для всей партии, затем вставьте по одному активу на строку в
            соответствии с шаблоном ниже. Ответственным будет указан текущий пользователь.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Шаблон строки</FormLabel>
                  <FormControl>
                    <Input placeholder={DEFAULT_TEMPLATE} {...field} />
                  </FormControl>
                  <FormDescription>
                    Доступные поля: {'{name}'}, {'{inventory}'}, {'{serial}'}. Поле, которое может
                    содержать разделитель (например, название), лучше разместить последним.
                  </FormDescription>
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
              {parsedTemplate.error && (
                <p className="mt-1.5 text-sm text-destructive">{parsedTemplate.error}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="raw_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Активы (по одному на строку)</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Canon 728 INV-1001 SN-CN-9931" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Инв. номер</TableHead>
                      <TableHead>Серийный номер</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.name ?? '—'}</TableCell>
                        <TableCell>{row.inventory_number ?? '—'}</TableCell>
                        <TableCell>{row.serial_number ?? '—'}</TableCell>
                        <TableCell>
                          {row.incomplete && (
                            <AlertTriangle className="size-4 text-amber-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
              <Button type="submit" disabled={bulkCreate.isPending || !!parsedTemplate.error}>
                Добавить активы
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
