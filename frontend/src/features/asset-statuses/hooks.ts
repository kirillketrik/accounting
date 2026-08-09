import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assetStatusesApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AssetStatusInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useAssetStatuses() {
  return useQuery({
    queryKey: queryKeys.assetStatuses,
    queryFn: assetStatusesApi.list,
  })
}

export function useCreateAssetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetStatusInput) => assetStatusesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetStatuses })
      toast.success('Статус создан')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateAssetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetStatusInput }) =>
      assetStatusesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetStatuses })
      toast.success('Статус обновлён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteAssetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assetStatusesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetStatuses })
      toast.success('Статус удалён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
