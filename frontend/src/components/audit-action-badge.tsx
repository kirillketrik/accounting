import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AUDIT_ACTION_LABELS, type AuditAction } from '@/api/types'

const ACTION_STYLES: Record<AuditAction, string> = {
  create: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  bulk_create: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400',
  delete: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
  bulk_delete: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
  archive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400',
}

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return (
    <Badge className={cn('border-transparent font-medium', ACTION_STYLES[action])}>
      {AUDIT_ACTION_LABELS[action]}
    </Badge>
  )
}
