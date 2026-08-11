import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { backupsApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type {
  BackupRecipientInput,
  BackupRecipientUpdateInput,
  BackupRunListParams,
  BackupSettingsCreateInput,
  BackupSettingsUpdateInput,
} from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

export function useBackupSettingsList() {
  return useQuery({
    queryKey: queryKeys.backupSettings,
    queryFn: () => backupsApi.listSettings(),
  })
}

export function useCreateBackupSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BackupSettingsCreateInput) => backupsApi.createSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backupSettings })
      toast.success('Настройки резервного копирования созданы')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateBackupSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BackupSettingsUpdateInput }) =>
      backupsApi.updateSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backupSettings })
      toast.success('Настройки резервного копирования сохранены')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteBackupSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => backupsApi.deleteSettings(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backupSettings })
      toast.success('Настройки резервного копирования удалены')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBackupRecipients(settingsId: number) {
  return useQuery({
    queryKey: queryKeys.backupRecipients(settingsId),
    queryFn: () => backupsApi.listRecipients(settingsId),
    enabled: !!settingsId,
  })
}

export function useCreateBackupRecipient(settingsId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BackupRecipientInput) => backupsApi.createRecipient(settingsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backupRecipients(settingsId) })
      toast.success('Получатель добавлен')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useUpdateBackupRecipient(settingsId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BackupRecipientUpdateInput }) =>
      backupsApi.updateRecipient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backupRecipients(settingsId) })
      toast.success('Получатель обновлён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useDeleteBackupRecipient(settingsId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => backupsApi.deleteRecipient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backupRecipients(settingsId) })
      toast.success('Получатель удалён')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBackupRuns(params: BackupRunListParams) {
  return useQuery({
    queryKey: queryKeys.backupRuns(params),
    queryFn: () => backupsApi.listRuns(params),
    placeholderData: (prev) => prev,
    refetchInterval: (query) => {
      const hasPending = query.state.data?.items.some((run) => run.status === 'pending')
      return hasPending ? 3000 : false
    },
  })
}

export function useRunBackupNow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settingsId: number) => backupsApi.runNow(settingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups', 'runs'] })
      toast.success('Резервное копирование запущено')
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useImportDatabase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, backupBeforeImport }: { file: File; backupBeforeImport: boolean }) =>
      backupsApi.import(file, backupBeforeImport),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups', 'runs'] })
      toast.success(
        'База данных импортирована. Перезапустите backend, celery-worker и celery-beat, чтобы изменения применились везде.'
      )
    },
    onError: (error: ApiError) => toast.error(error.message),
  })
}
