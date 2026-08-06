import {
  LayoutDashboard,
  Boxes,
  Tags,
  ListTree,
  Archive,
  ScrollText,
  Settings,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Дашборд', to: '/', icon: LayoutDashboard },
  { label: 'Активы', to: '/assets', icon: Boxes },
  { label: 'Типы активов', to: '/asset-types', icon: Tags },
  { label: 'Фабрика названий', to: '/asset-naming-rules', icon: Wand2 },
  { label: 'Типы событий', to: '/event-types', icon: ListTree },
  { label: 'История', to: '/history', icon: Archive },
  { label: 'Журнал действий', to: '/audit-log', icon: ScrollText },
  { label: 'Настройки', to: '/settings', icon: Settings },
]
