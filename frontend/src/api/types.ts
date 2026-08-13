export interface UserSummary {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface User extends UserSummary {
  is_admin: boolean
  is_active: boolean
}

export interface UserCreateInput {
  username: string
  password: string
  first_name: string
  last_name: string
  is_admin?: boolean
}

export interface UserUpdateInput {
  username?: string
  first_name?: string
  last_name?: string
  is_admin?: boolean
  is_active?: boolean
}

export interface PasswordResetInput {
  password: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface ChangePasswordInput {
  current_password: string
  new_password: string
}

export interface UpdateProfileInput {
  first_name?: string
  last_name?: string
}

export interface AssetStatus {
  id: number
  name: string
  description: string | null
  is_default: boolean
  is_disposal: boolean
}

export interface AssetStatusInput {
  name: string
  description?: string | null
  is_default?: boolean
  is_disposal?: boolean
}

export interface Place {
  id: number
  name: string
  description: string | null
}

export interface PlaceInput {
  name: string
  description?: string | null
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
  target_status_id: number
  target_status: AssetStatus
  counter_label: string | null
}

export interface EventTypeInput {
  name: string
  description?: string | null
  target_status_id: number
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
  inventory_number: number | null
  serial_number: string | null
  status_id: number
  status: AssetStatus
  place_id: number | null
  place: Place | null
  responsible_user: UserSummary | null
  notes: string | null
  created_at: string
  updated_at: string
  asset_type: AssetType
}

export interface AssetInput {
  asset_type_id: number
  name?: string | null
  inventory_number?: number | null
  serial_number?: string | null
  status_id?: number | null
  place_id?: number | null
  notes?: string | null
}

export interface AssetEvent {
  id: number
  asset_id: number
  event_type_id: number
  event_date: string
  description: string | null
  performed_by_user: UserSummary | null
  created_at: string
  event_type: EventType
}

export interface AssetEventInput {
  event_type_id: number
  event_date: string
  description?: string | null
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
  inventory_number: number | null
  serial_number: string | null
  place_name: string | null
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
  status_id: number
  status_name: string
  count: number
}

export interface AssetsByType {
  asset_type_id: number
  asset_type_name: string
  count: number
}

export interface EventsByType {
  event_type_id: number
  event_type_name: string
  count: number
}

export interface MonthlyActivityPoint {
  month: string
  new_assets: number
  events: number
  disposals: number
}

export interface LatestEvent {
  id: number
  asset_id: number
  asset_name: string
  event_type_name: string
  event_date: string
  performed_by_user: UserSummary | null
  created_at: string
}

export interface DashboardSummary {
  total_assets: number
  total_events: number
  total_disposals: number
  assets_by_status: AssetsByStatus[]
  assets_by_type: AssetsByType[]
  events_by_type: EventsByType[]
  monthly_activity: MonthlyActivityPoint[]
  latest_events: LatestEvent[]
}

export interface AssetListParams {
  search?: string
  status_id?: number
  asset_type_id?: number
  sort_by?:
    | 'name'
    | 'inventory_number'
    | 'status'
    | 'place'
    | 'responsible_user'
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
  default_asset_type_id: number | null
  default_bulk_asset_template: string | null
  default_bulk_asset_separator: string | null
  default_bulk_event_separator: string | null
  default_export_template: string | null
  default_export_separator: string | null
}

export interface AppSettingsInput {
  default_asset_type_id?: number | null
  default_bulk_asset_template?: string | null
  default_bulk_asset_separator?: string | null
  default_bulk_event_separator?: string | null
  default_export_template?: string | null
  default_export_separator?: string | null
}

export interface AssetExportParams {
  status_id?: number
  asset_type_id?: number
}

export interface AssetBulkItem {
  name?: string | null
  inventory_number?: number | null
  serial_number?: string | null
}

export interface AssetBulkCreateInput {
  asset_type_id: number
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

export interface AssetEventBulkResolveInput {
  asset_ids: number[]
  inventory_numbers: number[]
  asset_type_id?: number | null
}

export interface AssetEventBulkApplyInput extends AssetEventBulkResolveInput {
  event_type_id: number
  event_date: string
  description?: string | null
}

export interface AssetEventBulkCreated {
  asset_id: number
  asset_name: string
  inventory_number: number | null
  event: AssetEvent
}

export interface AssetEventBulkError {
  inventory_number: number
  message: string
}

export interface AssetEventBulkResult {
  created: AssetEventBulkCreated[]
  errors: AssetEventBulkError[]
}

export interface AssetEventBulkPreviewItem {
  asset_id: number
  asset_name: string
  asset_type: AssetType
  inventory_number: number | null
  status: AssetStatus
}

export interface AssetEventBulkPreviewResult {
  items: AssetEventBulkPreviewItem[]
  not_found: number[]
}

export interface AssetBulkPreviewItem {
  index: number
  name: string
  inventory_number: number | null
  serial_number: string | null
  asset_type: AssetType
  status: AssetStatus
  responsible_user: UserSummary | null
  error: string | null
}

export interface AssetBulkPreviewResult {
  items: AssetBulkPreviewItem[]
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

export type BackupSettingsType = 'telegram'

export interface BackupSettings {
  id: number
  name: string
  type: BackupSettingsType
  enabled: boolean
  interval_hours: number | null
  has_credentials: boolean
  last_run_at: string | null
  updated_at: string
}

export interface BackupSettingsCreateInput {
  name: string
  type: BackupSettingsType
  enabled?: boolean
  interval_hours?: number | null
  /** Opaque, transport-specific string produced by the type-specific creation form. */
  credentials?: string | null
}

export interface BackupSettingsUpdateInput {
  name?: string
  enabled?: boolean
  interval_hours?: number | null
  credentials?: string | null
}

export interface BackupRecipient {
  id: number
  backup_settings_id: number
  recipient_identifier: string
  label: string | null
  is_active: boolean
  created_at: string
}

export interface BackupRecipientInput {
  recipient_identifier: string
  label?: string | null
}

export interface BackupRecipientUpdateInput {
  label?: string | null
  is_active?: boolean
}

export type BackupRunTrigger = 'manual' | 'scheduled' | 'pre_import' | 'import'
export type BackupRunStatus = 'pending' | 'success' | 'partial' | 'failed'

export interface BackupDeliveryResult {
  recipient_identifier: string
  success: boolean
  error: string | null
}

export interface BackupRun {
  id: number
  trigger: BackupRunTrigger
  status: BackupRunStatus
  file_name: string | null
  file_size: number | null
  error_message: string | null
  delivery_details: BackupDeliveryResult[]
  triggered_by_user_id: number | null
  backup_settings_id: number | null
  created_at: string
}

export interface BackupRunListParams {
  page?: number
  page_size?: number
}

export interface ImportDatabaseInput {
  file: File
  backup_before_import: boolean
}

export interface ImportResult {
  pre_backup_filename: string | null
}
