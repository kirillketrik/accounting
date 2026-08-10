import type {
  AssetHistoryListParams,
  AssetListParams,
  AuditLogListParams,
  BackupRunListParams,
} from '@/api/types'

export const queryKeys = {
  assetTypes: ['asset-types'] as const,
  assetStatuses: ['asset-statuses'] as const,
  places: ['places'] as const,
  assetNamingRules: ['asset-naming-rules'] as const,
  eventTypes: ['event-types'] as const,
  assets: (params: AssetListParams) => ['assets', params] as const,
  asset: (id: number) => ['assets', id] as const,
  assetEvents: (assetId: number) => ['assets', assetId, 'events'] as const,
  assetEventCounters: (assetId: number) => ['assets', assetId, 'event-counters'] as const,
  assetHistory: (params: AssetHistoryListParams) => ['asset-history', params] as const,
  assetHistoryItem: (id: number) => ['asset-history', id] as const,
  auditLogs: (params: AuditLogListParams) => ['audit-logs', params] as const,
  auditLog: (id: number) => ['audit-logs', id] as const,
  dashboard: ['dashboard', 'summary'] as const,
  settings: ['settings'] as const,
  authMe: ['auth', 'me'] as const,
  users: ['users'] as const,
  backupSettings: ['backups', 'settings'] as const,
  backupRecipients: ['backups', 'recipients'] as const,
  backupRuns: (params: BackupRunListParams) => ['backups', 'runs', params] as const,
}
