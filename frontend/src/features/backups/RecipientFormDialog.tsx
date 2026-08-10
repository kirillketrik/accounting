import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import type { BackupRecipient } from '@/api/types'
import {
  recipientFormSchema,
  type RecipientFormValues,
} from '@/features/backups/backup-schema'

const EMPTY_VALUES: RecipientFormValues = { chat_id: '', label: '' }

function recipientToFormValues(recipient: BackupRecipient): RecipientFormValues {
  return { chat_id: recipient.chat_id, label: recipient.label ?? '' }
}

interface RecipientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient?: BackupRecipient
  isSubmitting: boolean
  onSubmit: (values: RecipientFormValues) => Promise<unknown>
}

export function RecipientFormDialog({
  open,
  onOpenChange,
  recipient,
  isSubmitting,
  onSubmit,
}: RecipientFormDialogProps) {
  const isEdit = !!recipient

  const form = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: recipient ? recipientToFormValues(recipient) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(recipient ? recipientToFormValues(recipient) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recipient])

  async function handleSubmit(values: RecipientFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить получателя' : 'Добавить получателя'}</DialogTitle>
          <DialogDescription>
            Резервные копии будут отправляться этому Telegram chat_id ботом, указанным в
            настройках.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="chat_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat ID</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" autoComplete="off" {...field} disabled={isEdit} />
                  </FormControl>
                  <FormDescription>
                    Узнать свой chat_id можно у бота @userinfobot в Telegram.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Метка</FormLabel>
                  <FormControl>
                    <Input placeholder="Например, Влад" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? 'Сохранить изменения' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
