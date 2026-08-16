import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { SeparatorField, type SeparatorPreset } from '@/components/separator-field'
import { TemplateBuilder } from '@/components/template-builder'

import { useAssetTypes } from '@/features/asset-types/hooks'
import { useBulkCreateAssets, useBulkPreviewAssets } from '@/features/assets/hooks'
import { useSettings, useUpdateSettings } from '@/features/settings/hooks'
import {
  bulkAssetFormSchema,
  type BulkAssetFormValues,
} from '@/features/assets/bulk-asset-schema'
import {
  BULK_ASSET_FIELD_LABELS,
  BULK_ASSET_VALID_FIELDS,
  extractBulkAssetTemplateFields,
  parseAssetLine,
  parseTemplate,
  toBulkItems,
} from '@/features/assets/bulk-parse'
import type { AppSettings, AppSettingsInput, AssetBulkCreateInput } from '@/api/types'

const DEFAULT_TEMPLATE = '{name} {inventory} {serial}'
const DEFAULT_SEPARATOR = ' '
const PREVIEW_DEBOUNCE_MS = 400

const SEPARATOR_PRESETS: SeparatorPreset[] = [
  { value: 'space', label: 'Пробел', separator: ' ' },
  { value: 'tab', label: 'Табуляция', separator: '\t' },
  { value: 'comma', label: 'Запятая', separator: ',' },
  { value: 'semicolon', label: 'Точка с запятой', separator: ';' },
  { value: 'custom', label: 'Другой', separator: '' },
]

function toSettingsInput(settings: AppSettings, overrides: Partial<AppSettingsInput>): AppSettingsInput {
  return {
    default_asset_type_id: settings.default_asset_type_id,
    default_bulk_asset_template: settings.default_bulk_asset_template,
    default_bulk_asset_separator: settings.default_bulk_asset_separator,
    default_bulk_event_separator: settings.default_bulk_event_separator,
    default_export_template: settings.default_export_template,
    default_export_separator: settings.default_export_separator,
    ...overrides,
  }
}

export function BulkAssetCreatePage() {
  const navigate = useNavigate()
  const { data: assetTypes } = useAssetTypes()
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const bulkCreate = useBulkCreateAssets()

  const [tab, setTab] = useState<'input' | 'preview'>('input')
  const [advancedMode, setAdvancedMode] = useState(false)

  const form = useForm<BulkAssetFormValues>({
    resolver: zodResolver(bulkAssetFormSchema),
    defaultValues: {
      asset_type_id: 0,
      template: DEFAULT_TEMPLATE,
      separator: DEFAULT_SEPARATOR,
      raw_text: '',
    },
  })

  const appliedDefaultsRef = useRef(false)
  useEffect(() => {
    if (appliedDefaultsRef.current || !settings) return
    appliedDefaultsRef.current = true
    form.reset({
      asset_type_id: settings.default_asset_type_id ?? 0,
      template: settings.default_bulk_asset_template || DEFAULT_TEMPLATE,
      separator: settings.default_bulk_asset_separator || DEFAULT_SEPARATOR,
      raw_text: '',
    })
  }, [settings, form])

  const assetTypeId = form.watch('asset_type_id')
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

  const parsedRows = useMemo(() => {
    if (parsedTemplate.error || lines.length === 0) return []
    return lines.map((line) => parseAssetLine(line, parsedTemplate.fields, separator))
  }, [lines, parsedTemplate, separator])

  const [previewPayload, setPreviewPayload] = useState<AssetBulkCreateInput | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (parsedTemplate.error || parsedRows.length === 0 || !assetTypeId) {
        setPreviewPayload(null)
        return
      }
      setPreviewPayload({ asset_type_id: assetTypeId, items: toBulkItems(parsedRows) })
    }, PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [assetTypeId, parsedRows, parsedTemplate.error])

  const preview = useBulkPreviewAssets(previewPayload)
  const previewItems = preview.data?.items ?? []
  const previewErrorCount = previewItems.filter((item) => item.error).length

  async function handleSetDefault() {
    if (!settings) return
    await updateSettings.mutateAsync(
      toSettingsInput(settings, {
        default_asset_type_id: assetTypeId || null,
        default_bulk_asset_template: template,
        default_bulk_asset_separator: separator,
      })
    )
  }

  async function onSubmit(values: BulkAssetFormValues) {
    if (parsedTemplate.error) return

    const result = await bulkCreate.mutateAsync({
      asset_type_id: values.asset_type_id,
      items: toBulkItems(parsedRows),
    })

    if (result.errors.length === 0) {
      if (
        settings &&
        (values.asset_type_id !== settings.default_asset_type_id ||
          values.template !== (settings.default_bulk_asset_template || DEFAULT_TEMPLATE) ||
          values.separator !== (settings.default_bulk_asset_separator || DEFAULT_SEPARATOR))
      ) {
        updateSettings.mutate(
          toSettingsInput(settings, {
            default_asset_type_id: values.asset_type_id,
            default_bulk_asset_template: values.template,
            default_bulk_asset_separator: values.separator,
          })
        )
      }
      navigate('/assets')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/assets')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Массовое добавление активов</h2>
          <p className="text-muted-foreground">
            Выберите тип актива для всей партии, затем вставьте по одному активу на строку.
            Ответственным будет указан текущий пользователь.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => value && setTab(value as 'input' | 'preview')}>
            <TabsList>
              <TabsTrigger value="input">Ввод</TabsTrigger>
              <TabsTrigger value="preview">
                Предпросмотр
                {previewItems.length > 0 && ` (${previewItems.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input">
              <Card>
                <CardContent className="space-y-4">
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
                            <SelectTrigger className="w-full sm:w-80">
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

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Шаблон строки</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={handleSetDefault}
                          disabled={!settings || updateSettings.isPending || !!parsedTemplate.error}
                        >
                          Установить шаблон по умолчанию
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setAdvancedMode((v) => !v)}
                        >
                          {advancedMode ? 'Обычный режим' : 'Расширенный режим'}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      {advancedMode ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input
                            placeholder={DEFAULT_TEMPLATE}
                            value={template}
                            onChange={(e) => form.setValue('template', e.target.value)}
                          />
                          <SeparatorField
                            value={separator}
                            onChange={(value) => form.setValue('separator', value)}
                            presets={SEPARATOR_PRESETS}
                          />
                        </div>
                      ) : (
                        <TemplateBuilder
                          template={template}
                          onTemplateChange={(value) => form.setValue('template', value)}
                          separator={separator}
                          onSeparatorChange={(value) => form.setValue('separator', value)}
                          validFields={BULK_ASSET_VALID_FIELDS}
                          fieldLabels={BULK_ASSET_FIELD_LABELS}
                          extractFields={extractBulkAssetTemplateFields}
                          separatorPresets={SEPARATOR_PRESETS}
                        />
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {advancedMode
                        ? 'Доступные поля: {name}, {inventory}, {serial}. Поле, которое может ' +
                          'содержать разделитель (например, название), лучше разместить последним.'
                        : 'Выберите поля и их порядок для шаблона.'}
                    </p>
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
                          <Textarea
                            rows={18}
                            placeholder="Canon 728 1001 SN-CN-9931"
                            className="font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {lines.length > 0
                            ? `Распознано строк: ${lines.length}`
                            : 'Вставьте активы, по одному на строку.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardContent>
                  {parsedTemplate.error ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="Проверьте шаблон строки"
                      description={parsedTemplate.error}
                    />
                  ) : parsedRows.length === 0 ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="Нет данных для предпросмотра"
                      description="Вернитесь на вкладку «Ввод» и добавьте активы."
                    />
                  ) : preview.isPending ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Формируем предпросмотр...
                    </div>
                  ) : (
                    <div
                      className={
                        preview.isFetching ? 'opacity-60 transition-opacity' : undefined
                      }
                    >
                      {previewErrorCount > 0 && (
                        <p className="mb-3 flex items-center gap-1.5 text-sm text-destructive">
                          <AlertTriangle className="size-4" />
                          Активов с ошибками: {previewErrorCount}. Они не будут добавлены.
                        </p>
                      )}
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Название</TableHead>
                              <TableHead>Тип</TableHead>
                              <TableHead>Инв. номер</TableHead>
                              <TableHead>Серийный номер</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead>Ответственное лицо</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewItems.map((item) => (
                              <TableRow
                                key={item.index}
                                className={item.error ? 'bg-destructive/5' : undefined}
                              >
                                <TableCell>{item.index + 1}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.asset_type.name}</TableCell>
                                <TableCell>
                                  {item.error ? (
                                    <span className="flex items-center gap-1 text-destructive">
                                      <AlertTriangle className="size-3.5" />
                                      {item.inventory_number ?? '—'}
                                    </span>
                                  ) : (
                                    (item.inventory_number ?? '—')
                                  )}
                                </TableCell>
                                <TableCell>{item.serial_number ?? '—'}</TableCell>
                                <TableCell>
                                  <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>
                                  {item.responsible_user
                                    ? `${item.responsible_user.first_name} ${item.responsible_user.last_name}`
                                    : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/assets')}
              disabled={bulkCreate.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={bulkCreate.isPending || !!parsedTemplate.error || parsedRows.length === 0}
            >
              {bulkCreate.isPending && <Loader2 className="size-4 animate-spin" />}
              Добавить активы
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
