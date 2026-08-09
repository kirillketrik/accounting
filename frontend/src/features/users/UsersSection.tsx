import { useState } from 'react'
import { MoreHorizontal, Plus, Users as UsersIcon } from 'lucide-react'

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
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'

import type { User } from '@/api/types'
import { useAuth } from '@/features/auth/useAuth'
import {
  useCreateUser,
  useResetPassword,
  useUpdateUser,
  useUsers,
} from '@/features/users/hooks'
import { UserFormDialog } from '@/features/users/UserFormDialog'
import { ResetPasswordDialog } from '@/features/users/ResetPasswordDialog'
import type { UserFormValues, ResetPasswordFormValues } from '@/features/users/user-schema'

export function UsersSection() {
  const { user: currentUser } = useAuth()
  const { data, isPending, isError, error, refetch } = useUsers()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const resetPasswordMutation = useResetPassword()

  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [resettingUser, setResettingUser] = useState<User | undefined>(undefined)

  async function handleSubmit(values: UserFormValues) {
    if (editingUser) {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        data: {
          username: values.username,
          first_name: values.first_name,
          last_name: values.last_name,
          is_admin: values.is_admin,
        },
      })
    } else {
      await createMutation.mutateAsync({
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password ?? '',
        is_admin: values.is_admin,
      })
    }
  }

  async function handleResetPassword(values: ResetPasswordFormValues) {
    if (!resettingUser) return
    await resetPasswordMutation.mutateAsync({ id: resettingUser.id, data: values })
  }

  function toggleActive(user: User) {
    updateMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Пользователи</h2>
          <p className="text-muted-foreground">
            Управляйте учётными записями. Регистрация закрыта — создавать пользователей
            может только администратор.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Добавить пользователя
        </Button>
      </div>

      {isError ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Список пуст"
          description="Добавьте первого пользователя, чтобы начать работу."
          action={
            <Button
              onClick={() => {
                setEditingUser(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Добавить пользователя
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя пользователя</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.username}</TableCell>
                  <TableCell>
                    {item.first_name} {item.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_admin ? 'default' : 'secondary'}>
                      {item.is_admin ? 'Администратор' : 'Пользователь'}
                    </Badge>
                  </TableCell>
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
                            setEditingUser(item)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResettingUser(item)}>
                          Сбросить пароль
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant={item.is_active ? 'destructive' : undefined}
                          disabled={item.id === currentUser?.id}
                          onClick={() => toggleActive(item)}
                        >
                          {item.is_active ? 'Отключить' : 'Включить'}
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

      <UserFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingUser(undefined)
        }}
        user={editingUser}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <ResetPasswordDialog
        open={!!resettingUser}
        onOpenChange={(open) => !open && setResettingUser(undefined)}
        user={resettingUser}
        isSubmitting={resetPasswordMutation.isPending}
        onSubmit={handleResetPassword}
      />
    </div>
  )
}
