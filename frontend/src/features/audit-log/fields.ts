export const AUDIT_FIELD_LABELS: Record<string, string> = {
  name: 'Название',
  asset_type_id: 'ID типа актива',
  inventory_number: 'Инв. номер',
  serial_number: 'Серийный номер',
  status_id: 'ID статуса',
  place_id: 'ID места',
  responsible_user_id: 'ID ответственного лица',
  notes: 'Примечания',
  asset_id: 'ID актива',
  event_type_id: 'ID типа события',
  event_date: 'Дата события',
  description: 'Описание',
  performed_by_user_id: 'ID исполнителя',
}

export function auditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field] ?? field
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет'
  if (typeof value === 'string') {
    const asDate = Date.parse(value)
    if (!Number.isNaN(asDate) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleString()
    }
    return value
  }
  return String(value)
}
