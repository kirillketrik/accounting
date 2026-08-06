import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { eventTypesApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { EventTypeInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useEventTypes() {
  return useQuery({
    queryKey: queryKeys.eventTypes,
    queryFn: eventTypesApi.list,
  })
}

export function useCreateEventType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EventTypeInput) => eventTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes })
      toast.success('Тип события создан')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateEventType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventTypeInput }) =>
      eventTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes })
      toast.success('Тип события обновлён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteEventType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eventTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes })
      toast.success('Тип события удалён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
