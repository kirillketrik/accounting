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

import type { User } from '@/api/types'
import { useAuth } from '@/features/auth/useAuth'
import { userFormSchema, type UserFormValues } from '@/features/users/user-schema'

const EMPTY_VALUES: UserFormValues = {
  username: '',
  first_name: '',
  last_name: '',
  password: '',
  is_admin: false,
}

function userToFormValues(user: User): UserFormValues {
  return {
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    password: '',
    is_admin: user.is_admin,
  }
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
  isSubmitting: boolean
  onSubmit: (values: UserFormValues) => Promise<unknown>
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  isSubmitting,
  onSubmit,
}: UserFormDialogProps) {
  const isEdit = !!user
  const { user: currentUser } = useAuth()
  const isSelf = isEdit && user.id === currentUser?.id

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user ? userToFormValues(user) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(user ? userToFormValues(user) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user])

  async function handleSubmit(values: UserFormValues) {
    if (!isEdit && (!values.password || values.password.length < 8)) {
      form.setError('password', { message: 'Минимум 8 символов' })
      return
    }
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить пользователя' : 'Добавить пользователя'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Отредактируйте данные пользователя. Пароль меняется отдельно.'
              : 'Создайте учётную запись и задайте начальный пароль.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя пользователя</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEdit ? (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="is_admin"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        disabled={isSelf}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="!m-0">Администратор</FormLabel>
                  </div>
                  {isSelf ? (
                    <p className="text-xs text-muted-foreground">
                      Вы не можете изменить собственную роль.
                    </p>
                  ) : null}
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
