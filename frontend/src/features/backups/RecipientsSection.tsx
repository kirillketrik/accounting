import { useState } from 'react'
import { MoreHorizontal, Plus, Send } from 'lucide-react'

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

import type { BackupRecipient } from '@/api/types'
import {
  useBackupRecipients,
  useCreateBackupRecipient,
  useDeleteBackupRecipient,
  useUpdateBackupRecipient,
} from '@/features/backups/hooks'
import { RecipientFormDialog } from '@/features/backups/RecipientFormDialog'
import type { RecipientFormValues } from '@/features/backups/backup-schema'

export function RecipientsSection() {
  const { data, isPending, isError, error, refetch } = useBackupRecipients()
  const createMutation = useCreateBackupRecipient()
  const updateMutation = useUpdateBackupRecipient()
  const deleteMutation = useDeleteBackupRecipient()

  const [formOpen, setFormOpen] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<BackupRecipient | undefined>(undefined)
  const [deletingRecipient, setDeletingRecipient] = useState<BackupRecipient | undefined>(
    undefined
  )

  async function handleSubmit(values: RecipientFormValues) {
    if (editingRecipient) {
      await updateMutation.mutateAsync({
        id: editingRecipient.id,
        data: { label: values.label || null },
      })
    } else {
      await createMutation.mutateAsync({ chat_id: values.chat_id, label: values.label || null })
    }
  }

  function toggleActive(recipient: BackupRecipient) {
    updateMutation.mutate({ id: recipient.id, data: { is_active: !recipient.is_active } })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5" />
              Получатели
            </CardTitle>
            <CardDescription>
              Telegram chat_id, которым бот отправляет резервные копии.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingRecipient(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" />
            Добавить получателя
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
            icon={Send}
            title="Получателей нет"
            description="Добавьте chat_id, чтобы резервные копии отправлялись в Telegram."
            action={
              <Button
                onClick={() => {
                  setEditingRecipient(undefined)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Добавить получателя
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Метка</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.chat_id}</TableCell>
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
      </CardContent>

      <RecipientFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingRecipient(undefined)
        }}
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
              Chat_id «{deletingRecipient?.chat_id}» перестанет получать резервные копии.
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
    </Card>
  )
}
