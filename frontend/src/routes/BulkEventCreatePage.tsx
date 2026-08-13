import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ErrorState } from '@/components/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { DataPagination } from '@/components/data-pagination'
import { StatusBadge } from '@/components/status-badge'

import type { AssetListParams } from '@/api/types'
import { useAssetStatuses } from '@/features/asset-statuses/hooks'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { useEventTypes } from '@/features/event-types/hooks'
import { useAssets } from '@/features/assets/hooks'
import { useBulkApplyEvents, useBulkPreviewEvents } from '@/features/assets/event-hooks'
import { useSettings, useUpdateSettings } from '@/features/settings/hooks'
import {
  bulkEventFormSchema,
  type BulkEventFormValues,
} from '@/features/assets/bulk-event-schema'
import { nowLocalIso } from '@/lib/datetime'
import type { AppSettings, AppSettingsInput } from '@/api/types'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SEPARATOR = '\n'
const PREVIEW_DEBOUNCE_MS = 400

type SortableColumn = NonNullable<AssetListParams['sort_by']>

const COLUMNS: { key: SortableColumn; label: string }[] = [
  { key: 'name', label: 'Название' },
  { key: 'asset_type', label: 'Тип' },
  { key: 'inventory_number', label: 'Инв. номер' },
  { key: 'status', label: 'Статус' },
  { key: 'place', label: 'Место' },
  { key: 'responsible_user', label: 'Ответственное лицо' },
]

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

export function BulkEventCreatePage() {
  const navigate = useNavigate()
  const { data: eventTypes } = useEventTypes()
  const { data: assetTypes } = useAssetTypes()
  const { data: assetStatuses } = useAssetStatuses()
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const bulkApply = useBulkApplyEvents()

  const [tab, setTab] = useState<'select' | 'preview'>('select')
  const [separatorPreset, setSeparatorPreset] = useState('newline')
  const [customSeparator, setCustomSeparator] = useState('')
  const [submitErrors, setSubmitErrors] = useState<number[]>([])

  const [status, setStatus] = useState<number | 'all'>('all')
  const [assetTypeId, setAssetTypeId] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortableColumn>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const form = useForm<BulkEventFormValues>({
    resolver: zodResolver(bulkEventFormSchema),
    defaultValues: {
      event_type_id: 0,
      event_date: nowLocalIso(),
      description: '',
      separator: DEFAULT_SEPARATOR,
      raw_text: '',
      inventory_asset_type_id: null,
    },
  })

  const appliedDefaultsRef = useRef(false)
  useEffect(() => {
    if (appliedDefaultsRef.current || !settings) return
    appliedDefaultsRef.current = true
    const separator = settings.default_bulk_event_separator || DEFAULT_SEPARATOR
    form.setValue('separator', separator)
    const preset = presetForSeparator(separator)
    setSeparatorPreset(preset)
    setCustomSeparator(preset === 'custom' ? separator : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

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

  async function handleSetDefaultSeparator() {
    if (!settings) return
    await updateSettings.mutateAsync(
      toSettingsInput(settings, { default_bulk_event_separator: form.getValues('separator') })
    )
  }

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAssets({
    status_id: status === 'all' ? undefined : status,
    asset_type_id: assetTypeId === 'all' ? undefined : assetTypeId,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    page_size: pageSize,
  })

  function toggleSort(column: SortableColumn) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
    setPage(1)
  }

  function sortIcon(column: SortableColumn) {
    if (sortBy !== column) return <ArrowUpDown className="size-3.5 text-muted-foreground" />
    return sortDir === 'asc' ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    )
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const pageIds = data?.items.map((asset) => asset.id) ?? []
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id)) && !allOnPageSelected

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const rawText = form.watch('raw_text')
  const separator = form.watch('separator')
  const inventoryAssetTypeId = form.watch('inventory_asset_type_id')

  const inventoryNumbers = useMemo(() => {
    if (!separator) return []
    const values = (rawText ?? '')
      .split(separator)
      .map((v) => v.trim())
      .filter((v) => /^\d+$/.test(v))
      .map(Number)
    return [...new Set(values)]
  }, [rawText, separator])

  const selectedIdsArray = useMemo(
    () => Array.from(selectedIds).sort((a, b) => a - b),
    [selectedIds]
  )

  const inventoryNumbersReady = inventoryNumbers.length === 0 || inventoryAssetTypeId !== null

  const resolvePayload = useMemo(() => {
    if (selectedIdsArray.length === 0 && inventoryNumbers.length === 0) return null
    if (!inventoryNumbersReady) return null
    return {
      asset_ids: selectedIdsArray,
      inventory_numbers: inventoryNumbers,
      asset_type_id: inventoryAssetTypeId,
    }
  }, [selectedIdsArray, inventoryNumbers, inventoryNumbersReady, inventoryAssetTypeId])

  const [debouncedPayload, setDebouncedPayload] = useState<typeof resolvePayload>(null)
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPayload(resolvePayload), PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [resolvePayload])

  const preview = useBulkPreviewEvents(debouncedPayload)
  const previewItems = preview.data?.items ?? []
  const notFound = preview.data?.not_found ?? []

  const selectedEventType = eventTypes?.find((t) => t.id === form.watch('event_type_id'))

  const canSubmit =
    (selectedIdsArray.length > 0 || inventoryNumbers.length > 0) && inventoryNumbersReady

  async function onSubmit(values: BulkEventFormValues) {
    const result = await bulkApply.mutateAsync({
      event_type_id: values.event_type_id,
      event_date: values.event_date,
      description: values.description || null,
      asset_ids: selectedIdsArray,
      inventory_numbers: inventoryNumbers,
      asset_type_id: values.inventory_asset_type_id,
    })

    setSubmitErrors(result.errors.map((e) => e.inventory_number))
    if (result.errors.length === 0) {
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
          <h2 className="text-2xl font-semibold tracking-tight">Массовое добавление событий</h2>
          <p className="text-muted-foreground">
            Выберите активы в таблице ниже или укажите их инвентарные номера, затем задайте
            параметры события.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => value && setTab(value as 'select' | 'preview')}>
            <TabsList>
              <TabsTrigger value="select">Выбор</TabsTrigger>
              <TabsTrigger value="preview">
                Предпросмотр
                {previewItems.length > 0 && ` (${previewItems.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-4">
              <Card>
                <CardContent className="space-y-4">
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
                            <SelectTrigger className="w-full sm:w-80">
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

                  <div className="grid gap-4 sm:grid-cols-2">
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
                            <Input placeholder="Необязательные детали" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      items={{
                        all: 'Все статусы',
                        ...Object.fromEntries(
                          (assetStatuses ?? []).map((s) => [String(s.id), s.name])
                        ),
                      }}
                      value={status === 'all' ? 'all' : String(status)}
                      onValueChange={(value) => {
                        setStatus(value === 'all' ? 'all' : Number(value))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Статус" />
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
                    <Select
                      items={{
                        all: 'Все типы',
                        ...Object.fromEntries(
                          (assetTypes ?? []).map((type) => [String(type.id), type.name])
                        ),
                      }}
                      value={assetTypeId === 'all' ? 'all' : String(assetTypeId)}
                      onValueChange={(value) => {
                        setAssetTypeId(value === 'all' ? 'all' : Number(value))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Тип актива" />
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

                  {selectedIds.size > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2">
                      <span className="text-sm font-medium">
                        Выбрано активов: {selectedIds.size}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                      >
                        <X className="size-4" />
                        Снять выделение
                      </Button>
                    </div>
                  )}

                  {isError ? (
                    <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
                  ) : isPending ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : data.items.length === 0 ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="Нет активов, соответствующих фильтрам"
                      description="Попробуйте изменить фильтры."
                    />
                  ) : (
                    <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <Checkbox
                                  checked={allOnPageSelected}
                                  indeterminate={someOnPageSelected}
                                  onCheckedChange={toggleSelectAllOnPage}
                                  aria-label="Выбрать все на странице"
                                />
                              </TableHead>
                              {COLUMNS.map((col) => (
                                <TableHead key={col.key}>
                                  <button
                                    type="button"
                                    onClick={() => toggleSort(col.key)}
                                    className="flex items-center gap-1 font-medium hover:text-foreground"
                                  >
                                    {col.label}
                                    {sortIcon(col.key)}
                                  </button>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.items.map((asset) => (
                              <TableRow
                                key={asset.id}
                                className="cursor-pointer"
                                onClick={() => toggleSelectOne(asset.id)}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedIds.has(asset.id)}
                                    onCheckedChange={() => toggleSelectOne(asset.id)}
                                    aria-label={`Выбрать ${asset.name}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{asset.name}</TableCell>
                                <TableCell>{asset.asset_type.name}</TableCell>
                                <TableCell>{asset.inventory_number ?? '—'}</TableCell>
                                <TableCell>
                                  <StatusBadge status={asset.status} />
                                </TableCell>
                                <TableCell>{asset.place?.name ?? '—'}</TableCell>
                                <TableCell>
                                  {asset.responsible_user
                                    ? `${asset.responsible_user.first_name} ${asset.responsible_user.last_name}`
                                    : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4">
                        <DataPagination
                          page={page}
                          pageSize={pageSize}
                          total={data.total}
                          onPageChange={setPage}
                          onPageSizeChange={(nextPageSize) => {
                            setPageSize(nextPageSize)
                            setPage(1)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Дополнительно по инвентарному номеру</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Активы, не попавшие в таблицу выше (например, отфильтрованные), можно
                      добавить по инвентарному номеру.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="inventory_asset_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип актива</FormLabel>
                        <Select
                          items={Object.fromEntries(
                            (assetTypes ?? []).map((type) => [String(type.id), type.name])
                          )}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(value) => field.onChange(value ? Number(value) : null)}
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
                        <FormDescription>
                          Инвентарные номера уникальны только в пределах одного типа актива.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Разделитель</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={handleSetDefaultSeparator}
                        disabled={!settings || updateSettings.isPending}
                      >
                        Установить по умолчанию
                      </Button>
                    </div>
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
                          <Textarea rows={4} placeholder={'1001\n1002\n1003'} {...field} />
                        </FormControl>
                        <FormDescription>Найдено номеров: {inventoryNumbers.length}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {submitErrors.length > 0 && (
                    <p className="text-sm text-destructive">
                      Не найдены: {submitErrors.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardContent>
                  {debouncedPayload === null ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="Нет данных для предпросмотра"
                      description="Выберите активы в таблице или укажите их инвентарные номера на вкладке «Выбор»."
                    />
                  ) : preview.isPending ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Формируем предпросмотр...
                    </div>
                  ) : (
                    <div
                      className={preview.isFetching ? 'opacity-60 transition-opacity' : undefined}
                    >
                      {notFound.length > 0 && (
                        <p className="mb-3 flex items-center gap-1.5 text-sm text-destructive">
                          <AlertTriangle className="size-4" />
                          Не найдены инвентарные номера: {notFound.join(', ')}
                        </p>
                      )}
                      {!selectedEventType && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          Выберите тип события на вкладке «Выбор», чтобы увидеть итоговый статус.
                        </p>
                      )}
                      {previewItems.length === 0 ? (
                        <EmptyState
                          icon={AlertTriangle}
                          title="Ничего не найдено"
                          description="Проверьте выбранные активы и введённые инвентарные номера."
                        />
                      ) : (
                        <div className="overflow-x-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>Название</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead>Инв. номер</TableHead>
                                <TableHead>Текущий статус</TableHead>
                                <TableHead>Статус после события</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewItems.map((item, index) => (
                                <TableRow key={item.asset_id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium">{item.asset_name}</TableCell>
                                  <TableCell>{item.asset_type.name}</TableCell>
                                  <TableCell>{item.inventory_number ?? '—'}</TableCell>
                                  <TableCell>
                                    <StatusBadge status={item.status} />
                                  </TableCell>
                                  <TableCell>
                                    {selectedEventType ? (
                                      <StatusBadge status={selectedEventType.target_status} />
                                    ) : (
                                      '—'
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
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
              disabled={bulkApply.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={bulkApply.isPending || !canSubmit}>
              {bulkApply.isPending && <Loader2 className="size-4 animate-spin" />}
              Добавить события
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
