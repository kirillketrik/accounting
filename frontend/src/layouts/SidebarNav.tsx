import { NavLink } from 'react-router-dom'
import { Package } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { navItems } from '@/layouts/nav-items'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.is_admin)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Package className="size-5" />
        <span className="font-semibold">Учёт активов</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
