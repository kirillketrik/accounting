import {
  LayoutDashboard,
  Boxes,
  Tags,
  MapPin,
  ListTree,
  Flag,
  Archive,
  DatabaseBackup,
  ScrollText,
  Settings,
  Users,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { label: 'Дашборд', to: '/', icon: LayoutDashboard },
  { label: 'Активы', to: '/assets', icon: Boxes },
  { label: 'Типы активов', to: '/asset-types', icon: Tags },
  { label: 'Места', to: '/places', icon: MapPin },
  { label: 'Фабрика названий', to: '/asset-naming-rules', icon: Wand2 },
  { label: 'Типы событий', to: '/event-types', icon: ListTree },
  { label: 'Статусы', to: '/asset-statuses', icon: Flag },
  { label: 'История', to: '/history', icon: Archive },
  { label: 'Журнал действий', to: '/audit-log', icon: ScrollText },
  { label: 'Настройки', to: '/settings', icon: Settings },
  { label: 'Пользователи', to: '/users', icon: Users, adminOnly: true },
  { label: 'Резервные копии', to: '/backups', icon: DatabaseBackup, adminOnly: true },
]
