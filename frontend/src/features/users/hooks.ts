import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usersApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { PasswordResetInput, UserCreateInput, UserUpdateInput } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: usersApi.list,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserCreateInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('Пользователь создан')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateInput }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('Пользователь обновлён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PasswordResetInput }) =>
      usersApi.resetPassword(id, data),
    onSuccess: () => toast.success('Пароль изменён'),
    onError: (error: ApiError) => toast.error(error.message),
  })
}
