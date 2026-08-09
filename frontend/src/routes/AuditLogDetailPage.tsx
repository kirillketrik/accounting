import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/error-state'
import { AuditActionBadge } from '@/components/audit-action-badge'

import { AUDIT_ENTITY_TYPE_LABELS } from '@/api/types'
import { useAuditLog } from '@/features/audit-log/hooks'
import { auditFieldLabel, formatAuditValue } from '@/features/audit-log/fields'

function isDiffShape(changes: Record<string, unknown>): boolean {
  return (
    !('created' in changes) &&
    !('deleted' in changes) &&
    Object.values(changes).every(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'before' in (value as Record<string, unknown>) &&
        'after' in (value as Record<string, unknown>)
    )
  )
}

function ValuesTable({ data }: { data: Record<string, unknown> }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(data).map(([field, value]) => (
          <tr key={field} className="border-b last:border-0">
            <td className="w-48 py-2 pr-4 align-top text-muted-foreground">
              {auditFieldLabel(field)}
            </td>
            <td className="py-2 font-medium">{formatAuditValue(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DiffTable({ diff }: { diff: Record<string, { before: unknown; after: unknown }> }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="w-48 py-2 pr-4 font-medium">Поле</th>
          <th className="py-2 pr-4 font-medium">Было</th>
          <th className="py-2 font-medium">Стало</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(diff).map(([field, { before, after }]) => (
          <tr key={field} className="border-b last:border-0">
            <td className="py-2 pr-4 align-top text-muted-foreground">{auditFieldLabel(field)}</td>
            <td className="py-2 pr-4 align-top">{formatAuditValue(before)}</td>
            <td className="py-2 align-top font-medium">{formatAuditValue(after)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function AuditLogDetailPage() {
  const params = useParams<{ id: string }>()
  const auditLogId = Number(params.id)
  const navigate = useNavigate()

  const query = useAuditLog(auditLogId)

  if (!Number.isFinite(auditLogId)) {
    return <ErrorState message="Некорректный идентификатор записи журнала." />
  }

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (query.isError) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
  }

  const item = query.data
  const changes = item.changes

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/audit-log')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{item.entity_name}</h2>
            <p className="text-muted-foreground">{AUDIT_ENTITY_TYPE_LABELS[item.entity_type]}</p>
          </div>
        </div>
        <AuditActionBadge action={item.action} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Дата и время</dt>
              <dd className="text-sm font-medium">{new Date(item.created_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">ID сущности</dt>
              <dd className="text-sm font-medium">{item.entity_id ?? '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Изменения</CardTitle>
        </CardHeader>
        <CardContent>
          {'created' in changes && (
            <ValuesTable data={changes.created as Record<string, unknown>} />
          )}
          {'deleted' in changes && (
            <div className="space-y-3">
              <ValuesTable data={changes.deleted as Record<string, unknown>} />
              {'asset_history_id' in changes && (
                <p className="text-sm text-muted-foreground">
                  Актив архивирован в{' '}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-2"
                    onClick={() => navigate(`/history/${changes.asset_history_id}`)}
                  >
                    истории списаний
                  </button>
                  .
                </p>
              )}
            </div>
          )}
          {isDiffShape(changes) &&
            (Object.keys(changes).length > 0 ? (
              <DiffTable diff={changes as Record<string, { before: unknown; after: unknown }>} />
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных об изменениях.</p>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
