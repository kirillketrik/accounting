import { useState } from 'react'
import { Download, History, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { DataPagination } from '@/components/data-pagination'

import { backupsApi } from '@/api/endpoints'
import type { BackupRun, BackupRunStatus, BackupRunTrigger } from '@/api/types'
import { useBackupRuns } from '@/features/backups/hooks'

const TRIGGER_LABELS: Record<BackupRunTrigger, string> = {
  manual: 'Вручную',
  scheduled: 'По расписанию',
  pre_import: 'Перед импортом',
  import: 'Импорт',
}

const STATUS_LABELS: Record<BackupRunStatus, string> = {
  pending: 'Выполняется',
  success: 'Успешно',
  partial: 'Частично',
  failed: 'Ошибка',
}

function StatusBadge({ status }: { status: BackupRunStatus }) {
  if (status === 'pending') {
    return (
      <Badge variant="outline">
        <Loader2 className="size-3 animate-spin" />
        {STATUS_LABELS[status]}
      </Badge>
    )
  }
  const variant = status === 'success' ? 'secondary' : status === 'partial' ? 'outline' : 'destructive'
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return '—'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} МБ` : `${(bytes / 1024).toFixed(0)} КБ`
}

function runDetails(run: BackupRun) {
  const parts: string[] = []
  if (run.error_message) parts.push(run.error_message)
  const failedRecipients = run.delivery_details.filter((d) => !d.success)
  if (failedRecipients.length > 0) {
    parts.push(
      failedRecipients
        .map((d) => `${d.recipient_identifier}: ${d.error ?? 'ошибка отправки'}`)
        .join('; ')
    )
  }
  return parts.join(' — ') || null
}

const DEFAULT_PAGE_SIZE = 10

export function BackupRunsTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useBackupRuns({
    page,
    page_size: pageSize,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5" />
          История запусков
        </CardTitle>
        <CardDescription>Последние резервные копии и попытки импорта.</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isPending || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={History}
            title="Запусков ещё не было"
            description="Здесь появится история ручных и автоматических резервных копий."
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата и время</TableHead>
                    <TableHead>Триггер</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead>Детали</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{new Date(run.created_at).toLocaleString('ru-RU')}</TableCell>
                      <TableCell>{TRIGGER_LABELS[run.trigger]}</TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>{formatBytes(run.file_size)}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {runDetails(run) ?? '—'}
                      </TableCell>
                      <TableCell>
                        {run.file_name ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => window.open(backupsApi.downloadUrl(run.id), '_blank')}
                          >
                            <Download className="size-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <DataPagination
                page={page}
                pageSize={pageSize}
                total={data.total}
                onPageChange={setPage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize)
                  setPage(1)
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
