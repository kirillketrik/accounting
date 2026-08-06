import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from '@/api/endpoints'
import { queryKeys } from '@/lib/query-keys'

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.summary,
  })
}
