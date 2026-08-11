import { Fragment, useState } from 'react'
import { ChevronDown, DatabaseBackup, MoreHorizontal, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'

import type { BackupSettings } from '@/api/types'
import {
  useBackupSettingsList,
  useCreateBackupSettings,
  useDeleteBackupSettings,
  useRunBackupNow,
  useUpdateBackupSettings,
} from '@/features/backups/hooks'
import {
  BackupSettingsFormDialog,
  type BackupSettingsFormValues,
} from '@/features/backups/BackupSettingsFormDialog'
import { RecipientsPanel } from '@/features/backups/RecipientsPanel'
import { BACKUP_SETTINGS_TYPE_LABELS } from '@/features/backups/backup-settings-types'

export function BackupSettingsSection() {
  const { data, isPending, isError, error, refetch } = useBackupSettingsList()
  const createMutation = useCreateBackupSettings()
  const updateMutation = useUpdateBackupSettings()
  const deleteMutation = useDeleteBackupSettings()
  const runNow = useRunBackupNow()

  const [formOpen, setFormOpen] = useState(false)
  const [editingSettings, setEditingSettings] = useState<BackupSettings | undefined>(undefined)
  const [deletingSettings, setDeletingSettings] = useState<BackupSettings | undefined>(undefined)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set())

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        setLoadedIds((loaded) => new Set(loaded).add(id))
      }
      return next
    })
  }

  async function handleSubmit(values: BackupSettingsFormValues) {
    if (editingSettings) {
      await updateMutation.mutateAsync({
        id: editingSettings.id,
        data: {
          name: values.name,
          enabled: values.enabled,
          interval_hours: values.interval_hours,
          credentials: values.credentials,
        },
      })
    } else {
      await createMutation.mutateAsync({
        name: values.name,
        type: values.type,
        enabled: values.enabled,
        interval_hours: values.interval_hours,
        credentials: values.credentials ?? undefined,
      })
    }
  }

  function openCreate() {
    setEditingSettings(undefined)
    setFormOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="size-5" />
              Резервное копирование
            </CardTitle>
            <CardDescription>
              Конфигурации периодической отправки резервных копий базы данных. Проверка
              расписания выполняется каждые 10 минут.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Добавить конфигурацию
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={(error as Error).message} onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={DatabaseBackup}
            title="Конфигураций нет"
            description="Добавьте конфигурацию, чтобы включить автоматическое резервное копирование."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Добавить конфигурацию
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Интервал</TableHead>
                  <TableHead>Последний запуск</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const expanded = expandedIds.has(item.id)
                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Свернуть получателей' : 'Показать получателей'}
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <ChevronDown
                              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {BACKUP_SETTINGS_TYPE_LABELS[item.type]}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.enabled ? 'secondary' : 'destructive'}>
                            {item.enabled ? 'Включено' : 'Отключено'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.interval_hours ? `${item.interval_hours} ч.` : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.last_run_at
                            ? new Date(item.last_run_at).toLocaleString('ru-RU')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={runNow.isPending}
                                onClick={() => runNow.mutate(item.id)}
                              >
                                Запустить сейчас
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingSettings(item)
                                  setFormOpen(true)
                                }}
                              >
                                Изменить
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeletingSettings(item)}
                              >
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-none hover:bg-transparent">
                        <TableCell colSpan={7} className="whitespace-normal p-0">
                          <Collapsible open={expanded}>
                            <CollapsibleContent>
                              <div className="border-t bg-muted/30">
                                {loadedIds.has(item.id) ? (
                                  <RecipientsPanel settings={item} />
                                ) : null}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <BackupSettingsFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingSettings(undefined)
        }}
        settings={editingSettings}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingSettings}
        onOpenChange={(open) => !open && setDeletingSettings(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить конфигурацию?</AlertDialogTitle>
            <AlertDialogDescription>
              Конфигурация «{deletingSettings?.name}», её сохранённые учётные данные и все
              получатели будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSettings) deleteMutation.mutate(deletingSettings.id)
                setDeletingSettings(undefined)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
