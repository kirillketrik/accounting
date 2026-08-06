import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ASSET_STATUS_LABELS, type AssetStatus } from '@/api/types'

const STATUS_STYLES: Record<AssetStatus, string> = {
  in_use: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  on_refill: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  in_storage: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400',
  disposed: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400',
}

export function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge className={cn('border-transparent font-medium', STATUS_STYLES[status])}>
      {ASSET_STATUS_LABELS[status]}
    </Badge>
  )
}
