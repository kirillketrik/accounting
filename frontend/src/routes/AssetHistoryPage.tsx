import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive } from 'lucide-react'

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

import { useAssetHistoryList } from '@/features/asset-history/hooks'

const PAGE_SIZE = 10

export function AssetHistoryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAssetHistoryList({
    page,
    page_size: PAGE_SIZE,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">История</h2>
        <p className="text-muted-foreground">Архив списанных активов.</p>
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
          icon={Archive}
          title="История пуста"
          description="Списанные активы будут появляться здесь."
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Инв. номер</TableHead>
                  <TableHead>Серийный номер</TableHead>
                  <TableHead>Списан</TableHead>
                  <TableHead>Место</TableHead>
                  <TableHead>Ответственное лицо</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/history/${item.id}`)}
                  >
                    <TableCell className="font-medium">{item.asset_name}</TableCell>
                    <TableCell>{item.asset_type_name}</TableCell>
                    <TableCell>{item.inventory_number ?? '—'}</TableCell>
                    <TableCell>{item.serial_number ?? '—'}</TableCell>
                    <TableCell>{new Date(item.disposed_at).toLocaleString()}</TableCell>
                    <TableCell>{item.place_name ?? '—'}</TableCell>
                    <TableCell>{item.responsible_person ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <DataPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
