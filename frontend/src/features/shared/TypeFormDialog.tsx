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

import { typeFormSchema, type TypeFormValues } from '@/features/shared/type-schema'

interface NamedEntity {
  id: number
  name: string
  description: string | null
}

interface TypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  namePlaceholder: string
  entity?: NamedEntity
  isSubmitting: boolean
  onSubmit: (values: TypeFormValues) => Promise<unknown>
}

const EMPTY_VALUES: TypeFormValues = { name: '', description: '' }

export function TypeFormDialog({
  open,
  onOpenChange,
  entityLabel,
  namePlaceholder,
  entity,
  isSubmitting,
  onSubmit,
}: TypeFormDialogProps) {
  const isEdit = !!entity

  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema),
    defaultValues: entity
      ? { name: entity.name, description: entity.description ?? '' }
      : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(entity ? { name: entity.name, description: entity.description ?? '' } : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity])

  async function handleSubmit(values: TypeFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Изменить ${entityLabel.toLowerCase()}` : `Добавить ${entityLabel.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Отредактируйте ${entityLabel.toLowerCase()}.`
              : `Создайте новый ${entityLabel.toLowerCase()}.`}
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
                    <Input placeholder={namePlaceholder} {...field} />
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
