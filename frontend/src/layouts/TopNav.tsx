import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
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
