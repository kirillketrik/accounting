import { ASSET_STATUS_LABELS, type Asset } from '@/api/types'

export type ExportField =
  | 'name'
  | 'inventory_number'
  | 'serial_number'
  | 'status'
  | 'location'
  | 'responsible_person'
  | 'asset_type'

const VALID_FIELDS: ExportField[] = [
  'name',
  'inventory_number',
  'serial_number',
  'status',
  'location',
  'responsible_person',
  'asset_type',
]

export const EXPORT_FIELD_LABELS: Record<ExportField, string> = {
  name: 'Название',
  inventory_number: 'Инвентарный номер',
  serial_number: 'Серийный номер',
  status: 'Статус',
  location: 'Местоположение',
  responsible_person: 'Ответственное лицо',
  asset_type: 'Тип актива',
}

export interface ParsedExportTemplate {
  fields: ExportField[]
  error?: string
}

/**
 * Mirrors the bulk-import template convention: an ordered list of `{field}` tokens
 * separated by `separator`, used both to describe and to produce each output line.
 */
export function parseExportTemplate(template: string, separator: string): ParsedExportTemplate {
  if (!separator) return { fields: [], error: 'Укажите разделитель' }

  const tokens = template
    .split(separator)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/^\{|\}$/g, ''))

  if (tokens.length === 0) {
    return { fields: [], error: 'Укажите хотя бы одно поле в шаблоне' }
  }

  const invalid = tokens.filter((t) => !VALID_FIELDS.includes(t as ExportField))
  if (invalid.length > 0) {
    return { fields: [], error: `Неизвестные поля: ${invalid.join(', ')}` }
  }

  return { fields: tokens as ExportField[] }
}

function exportFieldValue(asset: Asset, field: ExportField): string {
  switch (field) {
    case 'name':
      return asset.name
    case 'inventory_number':
      return asset.inventory_number ?? ''
    case 'serial_number':
      return asset.serial_number ?? ''
    case 'status':
      return ASSET_STATUS_LABELS[asset.status]
    case 'location':
      return asset.location ?? ''
    case 'responsible_person':
      return asset.responsible_person ?? ''
    case 'asset_type':
      return asset.asset_type.name
  }
}

export function formatExportLine(asset: Asset, fields: ExportField[], separator: string): string {
  return fields.map((field) => exportFieldValue(asset, field)).join(separator)
}
