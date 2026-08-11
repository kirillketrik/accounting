import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SidebarNav } from '@/layouts/SidebarNav'
import { navItems, type NavItem } from '@/layouts/nav-items'

function findTitle(items: NavItem[], pathname: string): string | undefined {
  for (const item of items) {
    if (item.to && (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to))) {
      return item.label
    }
  }
  for (const item of items) {
    if (item.children) {
      const match = findTitle(item.children, pathname)
      if (match) return match
    }
  }
  return undefined
}

function currentTitle(pathname: string): string {
  const match = findTitle(navItems, pathname)
  if (match) return match
  if (pathname.startsWith('/assets/')) return 'Информация об активе'
  if (pathname.startsWith('/profile')) return 'Профиль'
  return 'Учёт активов'
}

export function TopNav() {
  const location = useLocation()

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
    </header>
  )
}
