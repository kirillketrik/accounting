import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assetNamingRulesApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AssetNamingRuleInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useAssetNamingRules() {
  return useQuery({
    queryKey: queryKeys.assetNamingRules,
    queryFn: assetNamingRulesApi.list,
  })
}

export function useCreateAssetNamingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetNamingRuleInput) => assetNamingRulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetNamingRules })
      toast.success('Правило именования создано')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateAssetNamingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AssetNamingRuleInput> }) =>
      assetNamingRulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetNamingRules })
      toast.success('Правило именования обновлено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteAssetNamingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assetNamingRulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assetNamingRules })
      toast.success('Правило именования удалено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
