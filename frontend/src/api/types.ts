export type AssetStatus = 'on_refill' | 'in_storage' | 'in_use' | 'disposed'

export const ASSET_STATUSES: AssetStatus[] = ['on_refill', 'in_storage', 'in_use', 'disposed']

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  on_refill: 'На заправке',
  in_storage: 'На складе',
  in_use: 'Используется',
  disposed: 'Списан',
}

export interface AssetType {
  id: number
  name: string
  description: string | null
}

export interface AssetTypeInput {
  name: string
  description?: string | null
}

export interface EventType {
  id: number
  name: string
  description: string | null
  target_status: AssetStatus
  counter_label: string | null
}

export interface EventTypeInput {
  name: string
  description?: string | null
  target_status: AssetStatus
  counter_label?: string | null
}

export interface AssetNamingRule {
  id: number
  asset_type_id: number
  serial_number: string
  name_result: string
  is_active: boolean
  created_at: string
  updated_at: string
  asset_type: AssetType
}

export interface AssetNamingRuleInput {
  asset_type_id: number
  serial_number: string
  name_result: string
  is_active?: boolean
}

export interface Asset {
  id: number
  asset_type_id: number
  name: string
  inventory_number: string | null
  serial_number: string | null
  status: AssetStatus
  location: string | null
  responsible_person: string | null
  notes: string | null
  created_at: string
  updated_at: string
  asset_type: AssetType
}

export interface AssetInput {
  asset_type_id: number
  name?: string | null
  inventory_number?: string | null
  serial_number?: string | null
  location?: string | null
  responsible_person?: string | null
  notes?: string | null
}

export interface AssetEvent {
  id: number
  asset_id: number
  event_type_id: number
  event_date: string
  description: string | null
  performed_by: string | null
  created_at: string
  event_type: EventType
}

export interface AssetEventInput {
  event_type_id: number
  event_date: string
  description?: string | null
  performed_by?: string | null
}

export interface EventCounter {
  event_type_id: number
  event_type_name: string
  count: number
  label: string
}

export interface AssetHistoryEvent {
  event_type_name: string
  event_date: string
  description: string | null
  performed_by: string | null
  created_at: string
}

export interface AssetHistory {
  id: number
  asset_name: string
  asset_type_name: string
  inventory_number: string | null
  serial_number: string | null
  location: string | null
  responsible_person: string | null
  notes: string | null
  asset_created_at: string
  disposed_at: string
  events: AssetHistoryEvent[]
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface AssetsByStatus {
  status: AssetStatus
  count: number
}

export interface LatestEvent {
  id: number
  asset_id: number
  asset_name: string
  event_type_name: string
  event_date: string
  performed_by: string | null
  created_at: string
}

export interface DashboardSummary {
  total_assets: number
  assets_by_status: AssetsByStatus[]
  latest_events: LatestEvent[]
}

export interface AssetListParams {
  search?: string
  status?: AssetStatus
  asset_type_id?: number
  sort_by?:
    | 'name'
    | 'inventory_number'
    | 'status'
    | 'location'
    | 'responsible_person'
    | 'created_at'
    | 'asset_type'
  sort_dir?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface AssetHistoryListParams {
  page?: number
  page_size?: number
}

export interface AppSettings {
  id: number
  default_responsible_person: string | null
  default_asset_type_id: number | null
  default_bulk_asset_template: string | null
  default_bulk_asset_separator: string | null
  default_bulk_event_separator: string | null
  default_export_template: string | null
  default_export_separator: string | null
}

export interface AppSettingsInput {
  default_responsible_person?: string | null
  default_asset_type_id?: number | null
  default_bulk_asset_template?: string | null
  default_bulk_asset_separator?: string | null
  default_bulk_event_separator?: string | null
  default_export_template?: string | null
  default_export_separator?: string | null
}

export interface AssetExportParams {
  status?: AssetStatus
  asset_type_id?: number
}

export interface AssetBulkItem {
  name?: string | null
  inventory_number?: string | null
  serial_number?: string | null
}

export interface AssetBulkCreateInput {
  asset_type_id: number
  responsible_person?: string | null
  items: AssetBulkItem[]
}

export interface AssetBulkError {
  index: number
  message: string
}

export interface AssetBulkResult {
  created: Asset[]
  errors: AssetBulkError[]
}

export interface AssetEventBulkCreateInput {
  event_type_id: number
  event_date: string
  description?: string | null
  performed_by?: string | null
  inventory_numbers: string[]
}

export interface AssetEventBulkCreated {
  inventory_number: string
  asset_name: string
  event: AssetEvent
}

export interface AssetEventBulkError {
  inventory_number: string
  message: string
}

export interface AssetEventBulkResult {
  created: AssetEventBulkCreated[]
  errors: AssetEventBulkError[]
}

export interface AssetBulkDeleteError {
  id: number
  message: string
}

export interface AssetBulkDeleteResult {
  deleted_ids: number[]
  errors: AssetBulkDeleteError[]
}

export type AuditEntityType = 'asset' | 'asset_event'

export type AuditAction = 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_delete' | 'archive'

export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  asset: 'Актив',
  asset_event: 'Событие',
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  bulk_create: 'Массовое создание',
  bulk_delete: 'Массовое удаление',
  archive: 'Списание (архивирование)',
}

export interface AuditLog {
  id: number
  entity_type: AuditEntityType
  entity_id: number | null
  entity_name: string
  action: AuditAction
  created_at: string
}

export interface AuditLogDetail extends AuditLog {
  changes: Record<string, unknown>
}

export interface AuditLogListParams {
  entity_type?: AuditEntityType
  action?: AuditAction
  search?: string
  page?: number
  page_size?: number
}
