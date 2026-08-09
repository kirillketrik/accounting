import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import type { AssetStatus } from '@/api/types'
import {
  assetStatusFormSchema,
  type AssetStatusFormValues,
} from '@/features/asset-statuses/asset-status-schema'

const EMPTY_VALUES: AssetStatusFormValues = {
  name: '',
  description: '',
  is_default: false,
  is_disposal: false,
}

function statusToFormValues(status: AssetStatus): AssetStatusFormValues {
  return {
    name: status.name,
    description: status.description ?? '',
    is_default: status.is_default,
    is_disposal: status.is_disposal,
  }
}

interface AssetStatusFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status?: AssetStatus
  isSubmitting: boolean
  onSubmit: (values: AssetStatusFormValues) => Promise<unknown>
}

export function AssetStatusFormDialog({
  open,
  onOpenChange,
  status,
  isSubmitting,
  onSubmit,
}: AssetStatusFormDialogProps) {
  const isEdit = !!status

  const form = useForm<AssetStatusFormValues>({
    resolver: zodResolver(assetStatusFormSchema),
    defaultValues: status ? statusToFormValues(status) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(status ? statusToFormValues(status) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status])

  async function handleSubmit(values: AssetStatusFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить статус' : 'Добавить статус'}</DialogTitle>
          <DialogDescription>
            Статусы присваиваются активам событиями и отображаются в виде цветных меток.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Используется" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Необязательное описание" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="!m-0">
                      Статус по умолчанию для новых активов
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_disposal"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="!m-0">
                      Означает списание (актив архивируется автоматически)
                    </FormLabel>
                  </div>
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
                {isEdit ? 'Сохранить изменения' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
