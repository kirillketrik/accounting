import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { KeyRound, User as UserIcon } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { ApiError } from '@/api/client'
import { useAuth } from '@/features/auth/useAuth'

const editProfileSchema = z.object({
  first_name: z.string().min(1, 'Введите имя').max(100),
  last_name: z.string().min(1, 'Введите фамилию').max(100),
})

type EditProfileFormValues = z.infer<typeof editProfileSchema>

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Введите текущий пароль'),
  new_password: z.string().min(8, 'Минимум 8 символов').max(200),
})

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

function ProfileDetailsCard() {
  const { user, updateProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { first_name: '', last_name: '' },
  })

  useEffect(() => {
    form.reset({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleSubmit(values: EditProfileFormValues) {
    setIsSubmitting(true)
    try {
      await updateProfile(values)
      toast.success('Профиль обновлён')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось обновить профиль')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="size-5" />
          Личные данные
        </CardTitle>
        <CardDescription>Имя и фамилия, которые видят другие пользователи.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <Button type="submit" disabled={isSubmitting}>
              Сохранить
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function ChangePasswordCard() {
  const { changePassword } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '' },
  })

  async function handleSubmit(values: ChangePasswordFormValues) {
    setIsSubmitting(true)
    try {
      await changePassword(values)
      toast.success('Пароль изменён')
      form.reset({ current_password: '', new_password: '' })
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось изменить пароль')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5" />
          Пароль
        </CardTitle>
        <CardDescription>Введите текущий пароль и новый пароль.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущий пароль</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый пароль</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              Сменить пароль
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Профиль</h2>
        <p className="text-muted-foreground">Управление личными данными и паролем.</p>
      </div>

      <ProfileDetailsCard />
      <ChangePasswordCard />
    </div>
  )
}
