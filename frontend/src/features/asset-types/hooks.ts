import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assetTypesApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AssetTypeInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useAssetTypes() {
  return useQuery({
    queryKey: queryKeys.assetTypes,
    queryFn: assetTypesApi.list,
  })
}

export function useCreateAssetType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetTypeInput) => assetTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetTypes })
      toast.success('Тип актива создан')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateAssetType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetTypeInput }) =>
      assetTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetTypes })
      toast.success('Тип актива обновлён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteAssetType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assetTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetTypes })
      toast.success('Тип актива удалён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
