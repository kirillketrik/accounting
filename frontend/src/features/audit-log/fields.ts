import { ASSET_STATUS_LABELS, type AssetStatus } from '@/api/types'

export const AUDIT_FIELD_LABELS: Record<string, string> = {
  name: 'Название',
  asset_type_id: 'ID типа актива',
  inventory_number: 'Инв. номер',
  serial_number: 'Серийный номер',
  status: 'Статус',
  location: 'Местоположение',
  responsible_person: 'Ответственное лицо',
  notes: 'Примечания',
  asset_id: 'ID актива',
  event_type_id: 'ID типа события',
  event_date: 'Дата события',
  description: 'Описание',
  performed_by: 'Исполнитель',
}

export function auditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field] ?? field
}

export function formatAuditValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет'
  if (field === 'status' && typeof value === 'string' && value in ASSET_STATUS_LABELS) {
    return ASSET_STATUS_LABELS[value as AssetStatus]
  }
  if (typeof value === 'string') {
    const asDate = Date.parse(value)
    if (!Number.isNaN(asDate) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleString()
    }
    return value
  }
  return String(value)
}
