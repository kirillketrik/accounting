import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { placesApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { PlaceInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function usePlaces() {
  return useQuery({
    queryKey: queryKeys.places,
    queryFn: placesApi.list,
  })
}

export function useCreatePlace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PlaceInput) => placesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places })
      toast.success('Место создано')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdatePlace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlaceInput }) => placesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places })
      toast.success('Место обновлено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeletePlace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => placesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places })
      toast.success('Место удалено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
