import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { eventsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AssetEventBulkApplyInput, AssetEventBulkResolveInput, AssetEventInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useUpdateAssetEvent(assetId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetEventInput }) =>
      eventsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetEvents(assetId) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      toast.success('Событие обновлено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBulkApplyEvents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetEventBulkApplyInput) => eventsApi.bulkApply(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'bulk-preview'] })
      result.created.forEach(({ event }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.assetEvents(event.asset_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.assetEventCounters(event.asset_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.asset(event.asset_id) })
      })
      if (result.created.length > 0 && result.errors.length === 0) {
        toast.success(`Событий добавлено: ${result.created.length}`)
      } else if (result.created.length > 0) {
        toast.warning(`Добавлено: ${result.created.length}, не найдено: ${result.errors.length}`)
      } else {
        toast.error('Не удалось применить событие ни к одному активу')
      }
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBulkPreviewEvents(payload: AssetEventBulkResolveInput | null) {
  return useQuery({
    queryKey: queryKeys.eventBulkPreview(payload ?? { asset_ids: [], inventory_numbers: [] }),
    queryFn: () => eventsApi.bulkPreview(payload!),
    enabled: payload !== null,
    placeholderData: (prev) => prev,
  })
}

export function useDeleteAssetEvent(assetId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetEvents(assetId) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      toast.success('Событие удалено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
