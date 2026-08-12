import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { SeparatorField } from '@/components/separator-field'
import { EmptyState } from '@/components/empty-state'

import { assetsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AppSettings, AppSettingsInput, Asset } from '@/api/types'
import { useAssetExportPreview } from '@/features/assets/hooks'
import { useAssetStatuses } from '@/features/asset-statuses/hooks'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { useSettings, useUpdateSettings } from '@/features/settings/hooks'
import {
  EXPORT_FIELD_LABELS,
  EXPORT_VALID_FIELDS,
  extractExportTemplateFields,
  parseExportTemplate,
  formatExportLine,
} from '@/features/export/export-template'
import { TemplateBuilder } from '@/components/template-builder'

const DEFAULT_TEMPLATE = '{name} {inventory_number} {serial_number}'
const DEFAULT_SEPARATOR = ' '

type FileFormat = 'txt' | 'csv'

const previewAsset: Asset = {
  id: 0,
  asset_type_id: 0,
  name: 'Canon 728 Toner',
  inventory_number: 1001,
  serial_number: 'SN-CN-9931',
  status_id: 0,
  status: { id: 0, name: 'Используется', description: null, is_default: false, is_disposal: false },
  place_id: 0,
  place: { id: 0, name: '2 этаж - Бухгалтерия', description: null },
  responsible_user: { id: 0, username: 'dana', first_name: 'Дана', last_name: 'Коэн' },
  notes: null,
  custom_field_values: [],
  created_at: '',
  updated_at: '',
  asset_type: { id: 0, name: 'Картридж', description: null },
}

function toSettingsInput(settings: AppSettings, overrides: Partial<AppSettingsInput>): AppSettingsInput {
  return {
    default_bulk_asset_template: settings.default_bulk_asset_template,
    default_bulk_asset_separator: settings.default_bulk_asset_separator,
    default_bulk_event_separator: settings.default_bulk_event_separator,
    default_export_template: settings.default_export_template,
    default_export_separator: settings.default_export_separator,
    ...overrides,
  }
}

export function ExportAssetsPage() {
  const navigate = useNavigate()
  const { data: assetTypes } = useAssetTypes()
  const { data: assetStatuses } = useAssetStatuses()
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()

  const [tab, setTab] = useState<'input' | 'preview'>('input')
  const [status, setStatus] = useState<number | 'all'>('all')
  const [assetTypeId, setAssetTypeId] = useState<number | 'all'>('all')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [separator, setSeparator] = useState(DEFAULT_SEPARATOR)
  const [fileFormat, setFileFormat] = useState<FileFormat>('txt')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const appliedDefaultsRef = useRef(false)
  useEffect(() => {
    if (appliedDefaultsRef.current || !settings) return
    appliedDefaultsRef.current = true
    setTemplate(settings.default_export_template || DEFAULT_TEMPLATE)
    setSeparator(settings.default_export_separator || DEFAULT_SEPARATOR)
  }, [settings])

  const parsedTemplate = useMemo(
    () => parseExportTemplate(template, separator),
    [template, separator]
  )

  const previewLine = parsedTemplate.error
    ? null
    : formatExportLine(previewAsset, parsedTemplate.fields, separator)

  const exportParams = useMemo(
    () => ({
      status_id: status === 'all' ? undefined : status,
      asset_type_id: assetTypeId === 'all' ? undefined : assetTypeId,
    }),
    [status, assetTypeId]
  )

  const preview = useAssetExportPreview(exportParams, tab === 'preview' && !parsedTemplate.error)
  const previewAssets = preview.data ?? []

  async function handleSetDefault() {
    if (!settings) return
    await updateSettings.mutateAsync(
      toSettingsInput(settings, {
        default_export_template: template,
        default_export_separator: separator,
      })
    )
  }

  async function handleExport() {
    if (parsedTemplate.error) return
    setIsExporting(true)
    try {
      const assets = await assetsApi.export(exportParams)

      if (assets.length === 0) {
        toast.error('Нет активов, соответствующих фильтрам')
        return
      }

      const lines = assets.map((asset) => formatExportLine(asset, parsedTemplate.fields, separator))
      const mime = fileFormat === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'
      const blob = new Blob([lines.join('\n')], { type: mime })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `assets-export-${new Date().toISOString().slice(0, 10)}.${fileFormat}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success(`Экспортировано активов: ${assets.length}`)

      if (
        settings &&
        (template !== (settings.default_export_template || DEFAULT_TEMPLATE) ||
          separator !== (settings.default_export_separator || DEFAULT_SEPARATOR))
      ) {
        updateSettings.mutate(
          toSettingsInput(settings, {
            default_export_template: template,
            default_export_separator: separator,
          })
        )
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось экспортировать активы')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/assets')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Экспорт активов</h2>
          <p className="text-muted-foreground">
            Выберите фильтры и формат строки, затем скачайте список активов файлом.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => value && setTab(value as 'input' | 'preview')}>
        <TabsList>
          <TabsTrigger value="input">Настройки</TabsTrigger>
          <TabsTrigger value="preview">
            Предпросмотр
            {previewAssets.length > 0 && ` (${previewAssets.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Статус</Label>
                  <Select
                    items={{
                      all: 'Все статусы',
                      ...Object.fromEntries((assetStatuses ?? []).map((s) => [String(s.id), s.name])),
                    }}
                    value={status === 'all' ? 'all' : String(status)}
                    onValueChange={(value) =>
                      setStatus(!value || value === 'all' ? 'all' : Number(value))
                    }
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      {assetStatuses?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Тип актива</Label>
                  <Select
                    items={{
                      all: 'Все типы',
                      ...Object.fromEntries((assetTypes ?? []).map((type) => [String(type.id), type.name])),
                    }}
                    value={assetTypeId === 'all' ? 'all' : String(assetTypeId)}
                    onValueChange={(value) =>
                      setAssetTypeId(!value || value === 'all' ? 'all' : Number(value))
                    }
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      {assetTypes?.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    <Input
                      placeholder={DEFAULT_TEMPLATE}
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                    />
                  ) : (
                    <TemplateBuilder
                      template={template}
                      onTemplateChange={setTemplate}
                      separator={separator}
                      onSeparatorChange={setSeparator}
                      validFields={EXPORT_VALID_FIELDS}
                      fieldLabels={EXPORT_FIELD_LABELS}
                      extractFields={extractExportTemplateFields}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {advancedMode
                    ? 'Доступные поля: {name}, {inventory_number}, {serial_number}, {status}, {place}, {responsible_person}, {asset_type}.'
                    : 'Выберите поля и их порядок для шаблона.'}
                </p>
              </div>

              <div className={advancedMode ? 'grid grid-cols-2 gap-4' : ''}>
                {advancedMode && (
                  <div>
                    <Label>Разделитель</Label>
                    <div className="mt-1.5">
                      <SeparatorField value={separator} onChange={setSeparator} />
                    </div>
                  </div>
                )}
                <div>
                  <Label>Формат файла</Label>
                  <Select
                    items={{ txt: 'Текстовый файл (.txt)', csv: 'CSV (.csv)' }}
                    value={fileFormat}
                    onValueChange={(value) => setFileFormat((value as FileFormat) ?? 'txt')}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="txt">Текстовый файл (.txt)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {parsedTemplate.error ? (
                <p className="text-sm text-destructive">{parsedTemplate.error}</p>
              ) : (
                <div>
                  <Label>Пример строки</Label>
                  <pre className="mt-1.5 overflow-x-auto rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                    {previewLine}
                  </pre>
                </div>
              )}
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
              ) : preview.isPending ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Формируем предпросмотр...
                </div>
              ) : previewAssets.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Нет активов, соответствующих фильтрам"
                  description="Измените фильтры на вкладке «Настройки»."
                />
              ) : (
                <div className={preview.isFetching ? 'opacity-60 transition-opacity' : undefined}>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Строка</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewAssets.map((asset, index) => (
                          <TableRow key={asset.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-mono">
                              {formatExportLine(asset, parsedTemplate.fields, separator)}
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
          disabled={isExporting}
        >
          Отмена
        </Button>
        <Button type="button" onClick={handleExport} disabled={isExporting || !!parsedTemplate.error}>
          {isExporting && <Loader2 className="size-4 animate-spin" />}
          Экспортировать
        </Button>
      </div>
    </div>
  )
}
