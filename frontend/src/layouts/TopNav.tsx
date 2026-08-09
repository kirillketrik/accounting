import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LogOut, Menu, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ChangePasswordDialog } from '@/features/auth/ChangePasswordDialog'
import { EditProfileDialog } from '@/features/auth/EditProfileDialog'
import { useAuth } from '@/features/auth/useAuth'
import { SidebarNav } from '@/layouts/SidebarNav'
import { navItems } from '@/layouts/nav-items'

function currentTitle(pathname: string): string {
  const match = navItems.find((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  )
  if (match) return match.label
  if (pathname.startsWith('/assets/')) return 'Информация об активе'
  return 'Учёт активов'
}

export function TopNav() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Навигация</SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>
      <h1 className="text-base font-semibold">{currentTitle(location.pathname)}</h1>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="ml-auto gap-2" />}
          >
            <UserIcon className="size-4" />
            <span className="hidden sm:inline">
              {user.first_name} {user.last_name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {user.first_name} {user.last_name}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
              Изменить профиль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
              Сменить пароль
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => logout()}>
              <LogOut className="size-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </header>
  )
}
