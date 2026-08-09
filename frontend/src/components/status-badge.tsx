import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AssetStatus } from '@/api/types'

const STATUS_COLOR_PALETTE = [
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400',
  'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400',
  'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-400',
]

const DISPOSAL_COLOR = 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400'

export function StatusBadge({ status }: { status: AssetStatus }) {
  const color = status.is_disposal
    ? DISPOSAL_COLOR
    : STATUS_COLOR_PALETTE[status.id % STATUS_COLOR_PALETTE.length]

  return (
    <Badge className={cn('border-transparent font-medium', color)}>{status.name}</Badge>
  )
}
