import {
  LayoutDashboard,
  Boxes,
  Package2,
  PackagePlus,
  ListPlus,
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
  Shield,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to?: string
  icon: LucideIcon
  adminOnly?: boolean
  children?: NavItem[]
}

export const navItems: NavItem[] = [
  { label: 'Дашборд', to: '/', icon: LayoutDashboard },
  {
    label: 'Управление активами',
    icon: Boxes,
    children: [
      {
        label: 'Активы',
        to: '/assets',
        icon: Package2,
        children: [
          { label: 'Массовое добавление активов', to: '/assets/bulk-add', icon: PackagePlus },
          { label: 'Массовое добавление событий', to: '/assets/bulk-events', icon: ListPlus },
          { label: 'Фабрика названий', to: '/asset-naming-rules', icon: Wand2 },
        ],
      },
      { label: 'Типы активов', to: '/asset-types', icon: Tags },
      { label: 'Места', to: '/places', icon: MapPin },
      { label: 'Статусы', to: '/asset-statuses', icon: Flag },
      { label: 'Типы событий', to: '/event-types', icon: ListTree },
      { label: 'История', to: '/history', icon: Archive },
    ],
  },
  { label: 'Журнал действий', to: '/audit-log', icon: ScrollText, adminOnly: true },
  { label: 'Настройки', to: '/settings', icon: Settings },
  {
    label: 'Админка',
    icon: Shield,
    adminOnly: true,
    children: [
      { label: 'Пользователи', to: '/users', icon: Users },
      { label: 'Резервные копии', to: '/backups', icon: DatabaseBackup },
    ],
  },
]
