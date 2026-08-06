import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { settingsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AppSettingsInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsApi.get(),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AppSettingsInput) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      toast.success('Настройки сохранены')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
