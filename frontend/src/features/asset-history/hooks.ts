import { useQuery } from '@tanstack/react-query'

import { assetHistoryApi } from '@/api/endpoints'
import type { AssetHistoryListParams } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useAssetHistoryList(params: AssetHistoryListParams) {
  return useQuery({
    queryKey: queryKeys.assetHistory(params),
    queryFn: () => assetHistoryApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useAssetHistoryItem(id: number) {
  return useQuery({
    queryKey: queryKeys.assetHistoryItem(id),
    queryFn: () => assetHistoryApi.get(id),
    enabled: Number.isFinite(id),
  })
}
