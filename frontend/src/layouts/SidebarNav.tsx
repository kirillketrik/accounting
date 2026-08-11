import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, LogOut, Package, Pencil, User as UserIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { navItems, type NavItem } from '@/layouts/nav-items'

function isActivePath(to: string, pathname: string) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function containsActive(item: NavItem, pathname: string): boolean {
  if (item.to && isActivePath(item.to, pathname)) return true
  return item.children?.some((child) => containsActive(child, pathname)) ?? false
}

function collectActiveGroups(items: NavItem[], pathname: string, acc = new Set<string>()) {
  for (const item of items) {
    if (item.children && containsActive(item, pathname)) {
      acc.add(item.label)
      collectActiveGroups(item.children, pathname, acc)
    }
  }
  return acc
}

function filterVisible(items: NavItem[], isAdmin: boolean): NavItem[] {
  return items
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => (item.children ? { ...item, children: filterVisible(item.children, isAdmin) } : item))
}

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
    isActive
      ? 'text-secondary-foreground'
      : 'text-muted-foreground hover:text-foreground'
  )

function NavRow({
  item,
  depth,
  openGroups,
  onToggle,
  onNavigate,
}: {
  item: NavItem
  depth: number
  openGroups: Set<string>
  onToggle: (label: string) => void
  onNavigate?: () => void
}) {
  const paddingLeft = 12 + depth * 16

  if (!item.children) {
    return (
      <NavLink
        to={item.to!}
        end={item.to === '/'}
        onClick={onNavigate}
        style={{ paddingLeft, paddingRight: 12 }}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )
        }
      >
        <item.icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    )
  }

  const isOpen = openGroups.has(item.label)

  return (
    <Collapsible open={isOpen}>
      <div className="flex items-center gap-1 rounded-md pr-1" style={{ paddingLeft }}>
        {item.to ? (
          <NavLink to={item.to} onClick={onNavigate} className={linkClasses}>
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(item.label)}
            aria-expanded={isOpen}
            className="flex flex-1 items-center gap-3 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggle(item.label)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} />
        </button>
      </div>
      <CollapsibleContent>
        <div className="space-y-1 pb-1 pt-1">
          {item.children.map((child) => (
            <NavRow
              key={child.label}
              item={child}
              depth={depth + 1}
              openGroups={openGroups}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ProfileMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!user) return null

  const fullName = `${user.first_name} ${user.last_name}`.trim()
  const isActive = location.pathname.startsWith('/profile')

  return (
    <>
      <Collapsible open={open}>
        <div className="flex items-center gap-1 rounded-md pr-1">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className={cn(
              'flex flex-1 items-center gap-3 rounded-md py-2 pl-3 text-left text-sm font-medium transition-colors',
              isActive
                ? 'text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserIcon className="size-4 shrink-0" />
            <span className="truncate">{fullName}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? 'Свернуть' : 'Развернуть'}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className={cn('size-4 transition-transform', open && 'rotate-90')} />
          </button>
        </div>
        <CollapsibleContent>
          <div className="space-y-1 pb-1 pt-1">
            <NavLink
              to="/profile"
              onClick={onNavigate}
              style={{ paddingLeft: 28, paddingRight: 12 }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Pencil className="size-4 shrink-0" />
              <span className="truncate">Редактировать</span>
            </NavLink>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              style={{ paddingLeft: 28, paddingRight: 12 }}
              className="flex w-full items-center gap-3 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="truncate">Выйти</span>
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
            <AlertDialogDescription>
              Вам нужно будет снова войти, чтобы продолжить работу.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                onNavigate?.()
                logout()
              }}
            >
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const location = useLocation()
  const visibleItems = filterVisible(navItems, Boolean(user?.is_admin))

  const [openGroups, setOpenGroups] = useState<Set<string>>(() =>
    collectActiveGroups(visibleItems, location.pathname)
  )

  useEffect(() => {
    setOpenGroups((prev) => {
      const active = collectActiveGroups(visibleItems, location.pathname)
      const next = new Set(prev)
      active.forEach((label) => next.add(label))
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  function toggle(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Package className="size-5" />
        <span className="font-semibold">Учёт активов</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => (
          <NavRow
            key={item.label}
            item={item}
            depth={0}
            openGroups={openGroups}
            onToggle={toggle}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <div className="space-y-1 border-t p-3">
        <ProfileMenu onNavigate={onNavigate} />
      </div>
    </div>
  )
}
