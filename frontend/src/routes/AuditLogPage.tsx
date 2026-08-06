import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollText, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { AuditActionBadge } from '@/components/audit-action-badge'

import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  type AuditAction,
  type AuditEntityType,
} from '@/api/types'
import { useAuditLogs } from '@/features/audit-log/hooks'

const DEFAULT_PAGE_SIZE = 20

export function AuditLogPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState<AuditEntityType | 'all'>('all')
  const [action, setAction] = useState<AuditAction | 'all'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, 350)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAuditLogs({
    search: search || undefined,
    entity_type: entityType === 'all' ? undefined : entityType,
    action: action === 'all' ? undefined : action,
    page,
    page_size: pageSize,
  })

  const hasFilters = search !== '' || entityType !== 'all' || action !== 'all'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Журнал действий</h2>
        <p className="text-muted-foreground">
          История изменений по активам и событиям: кто что создал, изменил или удалил.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              debouncedSetSearch(e.target.value)
            }}
          />
        </div>
        <Select
          items={{ all: 'Все сущности', ...AUDIT_ENTITY_TYPE_LABELS }}
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value as AuditEntityType | 'all')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Сущность" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сущности</SelectItem>
            {(Object.entries(AUDIT_ENTITY_TYPE_LABELS) as [AuditEntityType, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          items={{ all: 'Все действия', ...AUDIT_ACTION_LABELS }}
          value={action}
          onValueChange={(value) => {
            setAction(value as AuditAction | 'all')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Действие" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все действия</SelectItem>
            {(Object.entries(AUDIT_ACTION_LABELS) as [AuditAction, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={hasFilters ? 'Нет записей, соответствующих фильтрам' : 'Журнал действий пуст'}
          description={
            hasFilters
              ? 'Попробуйте изменить параметры поиска или фильтры.'
              : 'Здесь будут появляться записи о создании, изменении и удалении активов и событий.'
          }
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Сущность</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Название</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/audit-log/${item.id}`)}
                  >
                    <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                    <TableCell>{AUDIT_ENTITY_TYPE_LABELS[item.entity_type]}</TableCell>
                    <TableCell>
                      <AuditActionBadge action={item.action} />
                    </TableCell>
                    <TableCell className="font-medium">{item.entity_name}</TableCell>
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
    </div>
  )
}
