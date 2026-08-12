import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assetCustomFieldDefinitionsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type {
  AssetCustomFieldDefinitionInput,
  AssetCustomFieldDefinitionUpdateInput,
} from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

/** Fetches all custom field definitions across every asset type (management page). */
export function useAssetCustomFieldDefinitions() {
  return useQuery({
    queryKey: queryKeys.assetCustomFieldDefinitions,
    queryFn: () => assetCustomFieldDefinitionsApi.list(),
  })
}

/**
 * Fetches definitions scoped to one asset type — for the asset create/edit form's
 * dynamic fields section. Disabled while no type is selected yet (assetTypeId is
 * undefined), using a query key distinct from useAssetCustomFieldDefinitions' so it
 * never serves that hook's cached full list while disabled.
 */
export function useAssetCustomFieldDefinitionsForType(assetTypeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.assetCustomFieldDefinitionsByType(assetTypeId ?? 0),
    queryFn: () => assetCustomFieldDefinitionsApi.list(assetTypeId),
    enabled: assetTypeId != null,
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['asset-custom-field-definitions'] })
}

export function useCreateAssetCustomFieldDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetCustomFieldDefinitionInput) =>
      assetCustomFieldDefinitionsApi.create(data),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Дополнительное поле создано')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateAssetCustomFieldDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetCustomFieldDefinitionUpdateInput }) =>
      assetCustomFieldDefinitionsApi.update(id, data),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Дополнительное поле обновлено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteAssetCustomFieldDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assetCustomFieldDefinitionsApi.delete(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Дополнительное поле удалено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
