import { apiClient } from '@/api/client'
import type {
  AppSettings,
  AppSettingsInput,
  Asset,
  AssetBulkCreateInput,
  AssetBulkDeleteResult,
  AssetBulkResult,
  AssetEvent,
  AssetEventBulkCreateInput,
  AssetEventBulkResult,
  AssetEventInput,
  AssetExportParams,
  AssetHistory,
  AssetHistoryListParams,
  AssetInput,
  AssetListParams,
  AssetNamingRule,
  AssetNamingRuleInput,
  AssetType,
  AssetTypeInput,
  AuditLog,
  AuditLogDetail,
  AuditLogListParams,
  DashboardSummary,
  EventCounter,
  EventType,
  EventTypeInput,
  PaginatedResponse,
} from '@/api/types'

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const assetTypesApi = {
  list: () => apiClient.get<AssetType[]>('/asset-types'),
  create: (data: AssetTypeInput) => apiClient.post<AssetType>('/asset-types', data),
  update: (id: number, data: AssetTypeInput) =>
    apiClient.put<AssetType>(`/asset-types/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/asset-types/${id}`),
}

export const assetNamingRulesApi = {
  list: () => apiClient.get<AssetNamingRule[]>('/asset-naming-rules'),
  create: (data: AssetNamingRuleInput) =>
    apiClient.post<AssetNamingRule>('/asset-naming-rules', data),
  update: (id: number, data: Partial<AssetNamingRuleInput>) =>
    apiClient.put<AssetNamingRule>(`/asset-naming-rules/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/asset-naming-rules/${id}`),
}

export const eventTypesApi = {
  list: () => apiClient.get<EventType[]>('/event-types'),
  create: (data: EventTypeInput) => apiClient.post<EventType>('/event-types', data),
  update: (id: number, data: EventTypeInput) =>
    apiClient.put<EventType>(`/event-types/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/event-types/${id}`),
}

export const assetsApi = {
  list: (params: AssetListParams) =>
    apiClient.get<PaginatedResponse<Asset>>(
      `/assets${buildQuery({
        search: params.search,
        status: params.status,
        asset_type_id: params.asset_type_id,
        sort_by: params.sort_by,
        sort_dir: params.sort_dir,
        page: params.page,
        page_size: params.page_size,
      })}`
    ),
  get: (id: number) => apiClient.get<Asset>(`/assets/${id}`),
  create: (data: AssetInput) => apiClient.post<Asset>('/assets', data),
  update: (id: number, data: AssetInput) => apiClient.put<Asset>(`/assets/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/assets/${id}`),
  bulkCreate: (data: AssetBulkCreateInput) =>
    apiClient.post<AssetBulkResult>('/assets/bulk', data),
  bulkDelete: (ids: number[]) =>
    apiClient.post<AssetBulkDeleteResult>('/assets/bulk-delete', { ids }),
  export: (params: AssetExportParams) =>
    apiClient.get<Asset[]>(
      `/assets/export${buildQuery({ status: params.status, asset_type_id: params.asset_type_id })}`
    ),
  listEvents: (assetId: number) => apiClient.get<AssetEvent[]>(`/assets/${assetId}/events`),
  createEvent: (assetId: number, data: AssetEventInput) =>
    apiClient.post<AssetEvent>(`/assets/${assetId}/events`, data),
  eventCounters: (assetId: number) =>
    apiClient.get<EventCounter[]>(`/assets/${assetId}/event-counters`),
}

export const eventsApi = {
  update: (id: number, data: AssetEventInput) => apiClient.put<AssetEvent>(`/events/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/events/${id}`),
  bulkCreate: (data: AssetEventBulkCreateInput) =>
    apiClient.post<AssetEventBulkResult>('/events/bulk', data),
}

export const settingsApi = {
  get: () => apiClient.get<AppSettings>('/settings'),
  update: (data: AppSettingsInput) => apiClient.put<AppSettings>('/settings', data),
}

export const assetHistoryApi = {
  list: (params: AssetHistoryListParams) =>
    apiClient.get<PaginatedResponse<AssetHistory>>(
      `/asset-history${buildQuery({ page: params.page, page_size: params.page_size })}`
    ),
  get: (id: number) => apiClient.get<AssetHistory>(`/asset-history/${id}`),
}

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
}

export const auditLogsApi = {
  list: (params: AuditLogListParams) =>
    apiClient.get<PaginatedResponse<AuditLog>>(
      `/audit-logs${buildQuery({
        entity_type: params.entity_type,
        action: params.action,
        search: params.search,
        page: params.page,
        page_size: params.page_size,
      })}`
    ),
  get: (id: number) => apiClient.get<AuditLogDetail>(`/audit-logs/${id}`),
}
