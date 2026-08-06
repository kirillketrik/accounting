import { useQuery } from '@tanstack/react-query'

import { auditLogsApi } from '@/api/endpoints'
import type { AuditLogListParams } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => auditLogsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useAuditLog(id: number) {
  return useQuery({
    queryKey: queryKeys.auditLog(id),
    queryFn: () => auditLogsApi.get(id),
    enabled: Number.isFinite(id),
  })
}
