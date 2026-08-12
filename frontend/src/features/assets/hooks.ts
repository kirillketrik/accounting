import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assetsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type {
  AssetBulkCreateInput,
  AssetEventInput,
  AssetExportParams,
  AssetInput,
  AssetListParams,
} from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useAssets(params: AssetListParams) {
  return useQuery({
    queryKey: queryKeys.assets(params),
    queryFn: () => assetsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useAsset(id: number) {
  return useQuery({
    queryKey: queryKeys.asset(id),
    queryFn: () => assetsApi.get(id),
    enabled: Number.isFinite(id),
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetInput) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      toast.success('Актив создан')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetInput }) => assetsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.asset(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      toast.success('Актив обновлён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBulkCreateAssets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetBulkCreateInput) => assetsApi.bulkCreate(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      if (result.created.length > 0 && result.errors.length === 0) {
        toast.success(`Добавлено активов: ${result.created.length}`)
      } else if (result.created.length > 0) {
        toast.warning(`Добавлено: ${result.created.length}, ошибок: ${result.errors.length}`)
      } else {
        toast.error('Не удалось добавить ни одного актива')
      }
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBulkPreviewAssets(payload: AssetBulkCreateInput | null) {
  return useQuery({
    queryKey: queryKeys.assetBulkPreview(payload ?? { asset_type_id: 0, items: [] }),
    queryFn: () => assetsApi.bulkPreview(payload!),
    enabled: payload !== null,
    placeholderData: (prev) => prev,
  })
}

export function useAssetExportPreview(params: AssetExportParams, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.assetExportPreview(params),
    queryFn: () => assetsApi.export(params),
    enabled,
    placeholderData: (prev) => prev,
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      toast.success('Актив удалён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBulkDeleteAssets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => assetsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      if (result.deleted_ids.length > 0 && result.errors.length === 0) {
        toast.success(`Удалено активов: ${result.deleted_ids.length}`)
      } else if (result.deleted_ids.length > 0) {
        toast.warning(
          `Удалено: ${result.deleted_ids.length}, ошибок: ${result.errors.length}`
        )
      } else {
        toast.error('Не удалось удалить ни одного актива')
      }
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useAssetEvents(assetId: number) {
  return useQuery({
    queryKey: queryKeys.assetEvents(assetId),
    queryFn: () => assetsApi.listEvents(assetId),
    enabled: Number.isFinite(assetId),
  })
}

export function useCreateAssetEvent(assetId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetEventInput) => assetsApi.createEvent(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetEvents(assetId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.assetEventCounters(assetId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      toast.success('Событие добавлено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useAssetEventCounters(assetId: number) {
  return useQuery({
    queryKey: queryKeys.assetEventCounters(assetId),
    queryFn: () => assetsApi.eventCounters(assetId),
    enabled: Number.isFinite(assetId),
  })
}
