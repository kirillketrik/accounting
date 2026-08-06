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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ASSET_STATUSES, ASSET_STATUS_LABELS, type EventType } from '@/api/types'
import {
  eventTypeFormSchema,
  type EventTypeFormValues,
} from '@/features/event-types/event-type-schema'

const EMPTY_VALUES: EventTypeFormValues = {
  name: '',
  description: '',
  target_status: 'in_storage',
  counter_label: '',
}

function eventTypeToFormValues(eventType: EventType): EventTypeFormValues {
  return {
    name: eventType.name,
    description: eventType.description ?? '',
    target_status: eventType.target_status,
    counter_label: eventType.counter_label ?? '',
  }
}

interface EventTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventType?: EventType
  isSubmitting: boolean
  onSubmit: (values: EventTypeFormValues) => Promise<unknown>
}

export function EventTypeFormDialog({
  open,
  onOpenChange,
  eventType,
  isSubmitting,
  onSubmit,
}: EventTypeFormDialogProps) {
  const isEdit = !!eventType

  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: eventType ? eventTypeToFormValues(eventType) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(eventType ? eventTypeToFormValues(eventType) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventType])

  async function handleSubmit(values: EventTypeFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить тип события' : 'Добавить тип события'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Отредактируйте тип события и статус, который он присваивает активу.'
              : 'Создайте новый тип события и укажите, какой статус он присваивает активу.'}
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
                    <Input placeholder="напр. Установить" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус актива после события</FormLabel>
                  <Select
                    items={ASSET_STATUS_LABELS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSET_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {ASSET_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="counter_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текст счётчика</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Заправлялся {n} раз" {...field} />
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
