import type { Asset } from '@/api/types'

export type ExportField =
  | 'name'
  | 'inventory_number'
  | 'serial_number'
  | 'status'
  | 'place'
  | 'responsible_person'
  | 'asset_type'

export const EXPORT_VALID_FIELDS: ExportField[] = [
  'name',
  'inventory_number',
  'serial_number',
  'status',
  'place',
  'responsible_person',
  'asset_type',
]

export const EXPORT_FIELD_LABELS: Record<ExportField, string> = {
  name: 'Название',
  inventory_number: 'Инвентарный номер',
  serial_number: 'Серийный номер',
  status: 'Статус',
  place: 'Место',
  responsible_person: 'Ответственное лицо',
  asset_type: 'Тип актива',
}

const TEMPLATE_TOKEN_RE = /\{([a-zA-Z0-9_]+)\}/g

export interface ParsedExportTemplate {
  fields: ExportField[]
  error?: string
}

/**
 * Extracts the ordered list of {field} placeholders from a template like
 * "{name} {inventory_number}". Placeholder extraction is independent of the
 * separator — literal text around/between placeholders is purely cosmetic and
 * doesn't affect validation, only the positional field order does.
 */
export function parseExportTemplate(template: string, separator: string): ParsedExportTemplate {
  if (!separator) return { fields: [], error: 'Укажите разделитель' }

  const tokens = [...template.matchAll(TEMPLATE_TOKEN_RE)].map((m) => m[1])

  if (tokens.length === 0) {
    return { fields: [], error: 'Укажите хотя бы одно поле в шаблоне' }
  }

  const invalid = tokens.filter((t) => !EXPORT_VALID_FIELDS.includes(t as ExportField))
  if (invalid.length > 0) {
    return { fields: [], error: `Неизвестные поля: ${invalid.join(', ')}` }
  }

  return { fields: tokens as ExportField[] }
}

/**
 * Best-effort ordered list of known fields present in a template — used to
 * initialize/derive the field builder UI. Unlike `parseExportTemplate`, this
 * never errors: unknown placeholders and repeats are silently dropped.
 */
export function extractExportTemplateFields(template: string): ExportField[] {
  const tokens = [...template.matchAll(TEMPLATE_TOKEN_RE)].map((m) => m[1])
  const fields: ExportField[] = []
  for (const t of tokens) {
    if (EXPORT_VALID_FIELDS.includes(t as ExportField) && !fields.includes(t as ExportField)) {
      fields.push(t as ExportField)
    }
  }
  return fields
}

function exportFieldValue(asset: Asset, field: ExportField): string {
  switch (field) {
    case 'name':
      return asset.name
    case 'inventory_number':
      return asset.inventory_number != null ? String(asset.inventory_number) : ''
    case 'serial_number':
      return asset.serial_number ?? ''
    case 'status':
      return asset.status.name
    case 'place':
      return asset.place?.name ?? ''
    case 'responsible_person':
      return asset.responsible_user
        ? `${asset.responsible_user.first_name} ${asset.responsible_user.last_name}`
        : ''
    case 'asset_type':
      return asset.asset_type.name
  }
}

export function formatExportLine(asset: Asset, fields: ExportField[], separator: string): string {
  return fields.map((field) => exportFieldValue(asset, field)).join(separator)
}
