import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeparatorField } from '@/components/separator-field'

import { assetsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { Asset, AssetStatus } from '@/api/types'
import { ASSET_STATUSES, ASSET_STATUS_LABELS } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { useSettings } from '@/features/settings/hooks'
import { parseExportTemplate, formatExportLine } from '@/features/export/export-template'

const DEFAULT_TEMPLATE = '{name} {inventory_number} {serial_number}'
const DEFAULT_SEPARATOR = ' '

type FileFormat = 'txt' | 'csv'

interface ExportAssetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportAssetsDialog({ open, onOpenChange }: ExportAssetsDialogProps) {
  const { data: assetTypes } = useAssetTypes()
  const { data: settings } = useSettings()

  const [status, setStatus] = useState<AssetStatus | 'all'>('all')
  const [assetTypeId, setAssetTypeId] = useState<number | 'all'>('all')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [separator, setSeparator] = useState(DEFAULT_SEPARATOR)
  const [fileFormat, setFileFormat] = useState<FileFormat>('txt')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStatus('all')
    setAssetTypeId('all')
    setTemplate(settings?.default_export_template || DEFAULT_TEMPLATE)
    setSeparator(settings?.default_export_separator || DEFAULT_SEPARATOR)
    setFileFormat('txt')
  }, [open, settings])

  const parsedTemplate = useMemo(
    () => parseExportTemplate(template, separator),
    [template, separator]
  )

  const previewAsset: Asset = {
    id: 0,
    asset_type_id: 0,
    name: 'Canon 728 Toner',
    inventory_number: 'INV-1001',
    serial_number: 'SN-CN-9931',
    status: 'in_use',
    location: '2 этаж - Бухгалтерия',
    responsible_person: 'Дана Коэн',
    notes: null,
    created_at: '',
    updated_at: '',
    asset_type: { id: 0, name: 'Картридж', description: null },
  }

  const previewLine = parsedTemplate.error
    ? null
    : formatExportLine(previewAsset, parsedTemplate.fields, separator)

  async function handleExport() {
    if (parsedTemplate.error) return
    setIsExporting(true)
    try {
      const assets = await assetsApi.export({
        status: status === 'all' ? undefined : status,
        asset_type_id: assetTypeId === 'all' ? undefined : assetTypeId,
      })

      if (assets.length === 0) {
        toast.error('Нет активов, соответствующих фильтрам')
        return
      }

      const lines = assets.map((asset) => formatExportLine(asset, parsedTemplate.fields, separator))
      const mime =
        fileFormat === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'
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
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось экспортировать активы')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Экспорт активов</DialogTitle>
          <DialogDescription>
            Выберите фильтры и формат строки, затем скачайте список активов файлом.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Статус</Label>
              <Select
                items={{ all: 'Все статусы', ...ASSET_STATUS_LABELS }}
                value={status}
                onValueChange={(value) => setStatus((value as AssetStatus | 'all') ?? 'all')}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {ASSET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ASSET_STATUS_LABELS[s]}
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
            <Label>Шаблон строки</Label>
            <Input
              className="mt-1.5"
              placeholder={DEFAULT_TEMPLATE}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              Доступные поля: {'{name}'}, {'{inventory_number}'}, {'{serial_number}'},{' '}
              {'{status}'}, {'{location}'}, {'{responsible_person}'}, {'{asset_type}'}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Разделитель</Label>
              <div className="mt-1.5">
                <SeparatorField value={separator} onChange={setSeparator} />
              </div>
            </div>
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
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !!parsedTemplate.error}
          >
            {isExporting ? 'Экспорт...' : 'Экспортировать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
