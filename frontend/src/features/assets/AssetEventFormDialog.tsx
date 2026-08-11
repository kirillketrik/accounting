import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

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

import type { AssetEvent } from '@/api/types'
import { useEventTypes } from '@/features/event-types/hooks'
import { useCreateAssetEvent } from '@/features/assets/hooks'
import { useUpdateAssetEvent } from '@/features/assets/event-hooks'
import {
  assetEventFormSchema,
  type AssetEventFormValues,
} from '@/features/assets/asset-event-schema'
import { nowLocalIso, toDatetimeLocalValue } from '@/lib/datetime'

const EMPTY_VALUES: AssetEventFormValues = {
  event_type_id: 0,
  event_date: nowLocalIso(),
  description: '',
}

function eventToFormValues(event: AssetEvent): AssetEventFormValues {
  return {
    event_type_id: event.event_type_id,
    event_date: toDatetimeLocalValue(event.event_date),
    description: event.description ?? '',
  }
}

interface AssetEventFormDialogProps {
  assetId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: AssetEvent
  fixedEventTypeId?: number
}

export function AssetEventFormDialog({
  assetId,
  open,
  onOpenChange,
  event,
  fixedEventTypeId,
}: AssetEventFormDialogProps) {
  const isEdit = !!event
  const navigate = useNavigate()
  const { data: eventTypes } = useEventTypes()
  const createEvent = useCreateAssetEvent(assetId)
  const updateEvent = useUpdateAssetEvent(assetId)

  const defaultValues = event
    ? eventToFormValues(event)
    : { ...EMPTY_VALUES, event_type_id: fixedEventTypeId ?? EMPTY_VALUES.event_type_id }

  const form = useForm<AssetEventFormValues>({
    resolver: zodResolver(assetEventFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        event
          ? eventToFormValues(event)
          : { ...EMPTY_VALUES, event_type_id: fixedEventTypeId ?? EMPTY_VALUES.event_type_id }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event, fixedEventTypeId])

  const fixedEventType =
    !isEdit && fixedEventTypeId
      ? eventTypes?.find((type) => type.id === fixedEventTypeId)
      : undefined

  const isSubmitting = createEvent.isPending || updateEvent.isPending

  async function onSubmit(values: AssetEventFormValues) {
    const payload = {
      event_type_id: values.event_type_id,
      event_date: values.event_date,
      description: values.description || null,
    }

    if (isEdit) {
      await updateEvent.mutateAsync({ id: event.id, data: payload })
    } else {
      const created = await createEvent.mutateAsync(payload)
      if (created.event_type.target_status.is_disposal) {
        onOpenChange(false)
        toast.success('Актив списан и перемещён в историю')
        navigate('/history')
        return
      }
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить событие' : 'Добавить событие'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Обновите это событие в истории актива.'
              : 'Зафиксируйте новое событие для этого актива.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && fixedEventTypeId ? (
              <div>
                <p className="text-sm font-medium">Тип события</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fixedEventType?.name ?? '—'}
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="event_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип события</FormLabel>
                    <Select
                      items={Object.fromEntries(
                        (eventTypes ?? []).map((type) => [String(type.id), type.name])
                      )}
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите тип события" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes?.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата и время</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && event.performed_by_user ? (
              <div>
                <p className="text-sm font-medium">Исполнитель</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.performed_by_user.first_name} {event.performed_by_user.last_name}
                  {' — обновится на вас при сохранении'}
                </p>
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Необязательные детали" {...field} />
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
                {isEdit ? 'Сохранить изменения' : 'Добавить событие'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
