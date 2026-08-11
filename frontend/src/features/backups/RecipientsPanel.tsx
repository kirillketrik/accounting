import { useState } from 'react'
import { MoreHorizontal, Plus, Send } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

import type { BackupRecipient, BackupSettings } from '@/api/types'
import {
  useBackupRecipients,
  useCreateBackupRecipient,
  useDeleteBackupRecipient,
  useUpdateBackupRecipient,
} from '@/features/backups/hooks'
import { RecipientFormDialog } from '@/features/backups/RecipientFormDialog'
import type { RecipientFormValues } from '@/features/backups/backup-schema'
import { BACKUP_RECIPIENT_IDENTIFIER_HINTS } from '@/features/backups/backup-settings-types'

interface RecipientsPanelProps {
  settings: BackupSettings
}

export function RecipientsPanel({ settings }: RecipientsPanelProps) {
  const { data, isPending, isError, error, refetch } = useBackupRecipients(settings.id)
  const createMutation = useCreateBackupRecipient(settings.id)
  const updateMutation = useUpdateBackupRecipient(settings.id)
  const deleteMutation = useDeleteBackupRecipient(settings.id)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<BackupRecipient | undefined>(undefined)
  const [deletingRecipient, setDeletingRecipient] = useState<BackupRecipient | undefined>(
    undefined
  )

  const identifierLabel = BACKUP_RECIPIENT_IDENTIFIER_HINTS[settings.type].label

  async function handleSubmit(values: RecipientFormValues) {
    if (editingRecipient) {
      await updateMutation.mutateAsync({
        id: editingRecipient.id,
        data: { label: values.label || null },
      })
    } else {
      await createMutation.mutateAsync({
        recipient_identifier: values.recipient_identifier,
        label: values.label || null,
      })
    }
  }

  function toggleActive(recipient: BackupRecipient) {
    updateMutation.mutate({ id: recipient.id, data: { is_active: !recipient.is_active } })
  }

  function openCreate() {
    setEditingRecipient(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Send className="size-4" />
          Получатели «{settings.name}»
        </h4>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Добавить получателя
        </Button>
      </div>

      {isError ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Получателей нет"
          description="Добавьте получателя, чтобы резервные копии отправлялись через это назначение."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Добавить получателя
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{identifierLabel}</TableHead>
                <TableHead>Метка</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.recipient_identifier}</TableCell>
                  <TableCell className="text-muted-foreground">{item.label ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'secondary' : 'destructive'}>
                      {item.is_active ? 'Активен' : 'Отключён'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingRecipient(item)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(item)}>
                          {item.is_active ? 'Отключить' : 'Включить'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingRecipient(item)}
                        >
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RecipientFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingRecipient(undefined)
        }}
        settingsType={settings.type}
        recipient={editingRecipient}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingRecipient}
        onOpenChange={(open) => !open && setDeletingRecipient(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить получателя?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deletingRecipient?.recipient_identifier}» перестанет получать резервные копии.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingRecipient) deleteMutation.mutate(deletingRecipient.id)
                setDeletingRecipient(undefined)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
