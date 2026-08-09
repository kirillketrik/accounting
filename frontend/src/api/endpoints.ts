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
  AssetStatus,
  AssetStatusInput,
  AssetType,
  AssetTypeInput,
  AuditLog,
  AuditLogDetail,
  AuditLogListParams,
  ChangePasswordInput,
  DashboardSummary,
  EventCounter,
  EventType,
  EventTypeInput,
  LoginInput,
  PaginatedResponse,
  PasswordResetInput,
  Place,
  PlaceInput,
  UpdateProfileInput,
  User,
  UserCreateInput,
  UserUpdateInput,
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

export const assetStatusesApi = {
  list: () => apiClient.get<AssetStatus[]>('/asset-statuses'),
  create: (data: AssetStatusInput) => apiClient.post<AssetStatus>('/asset-statuses', data),
  update: (id: number, data: AssetStatusInput) =>
    apiClient.put<AssetStatus>(`/asset-statuses/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/asset-statuses/${id}`),
}

export const placesApi = {
  list: () => apiClient.get<Place[]>('/places'),
  create: (data: PlaceInput) => apiClient.post<Place>('/places', data),
  update: (id: number, data: PlaceInput) => apiClient.put<Place>(`/places/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/places/${id}`),
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
        status_id: params.status_id,
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
      `/assets/export${buildQuery({ status_id: params.status_id, asset_type_id: params.asset_type_id })}`
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

export const authApi = {
  login: (data: LoginInput) => apiClient.post<User>('/auth/login', data),
  logout: () => apiClient.post<void>('/auth/logout'),
  me: () => apiClient.get<User>('/auth/me'),
  changePassword: (data: ChangePasswordInput) =>
    apiClient.post<void>('/auth/change-password', data),
  updateProfile: (data: UpdateProfileInput) => apiClient.patch<User>('/auth/me', data),
}

export const usersApi = {
  list: () => apiClient.get<User[]>('/users'),
  create: (data: UserCreateInput) => apiClient.post<User>('/users', data),
  update: (id: number, data: UserUpdateInput) => apiClient.patch<User>(`/users/${id}`, data),
  resetPassword: (id: number, data: PasswordResetInput) =>
    apiClient.post<User>(`/users/${id}/reset-password`, data),
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
