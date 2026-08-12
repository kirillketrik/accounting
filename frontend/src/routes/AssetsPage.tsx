import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { DataPagination } from '@/components/data-pagination'
import { StatusBadge } from '@/components/status-badge'

import type { Asset, AssetListParams } from '@/api/types'
import { useAssetStatuses } from '@/features/asset-statuses/hooks'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { useAssets, useBulkDeleteAssets, useDeleteAsset } from '@/features/assets/hooks'
import { AssetFormDialog } from '@/features/assets/AssetFormDialog'

const DEFAULT_PAGE_SIZE = 10

type SortableColumn = NonNullable<AssetListParams['sort_by']>

const COLUMNS: { key: SortableColumn; label: string }[] = [
  { key: 'name', label: 'Название' },
  { key: 'asset_type', label: 'Тип' },
  { key: 'inventory_number', label: 'Инв. номер' },
  { key: 'status', label: 'Статус' },
  { key: 'place', label: 'Место' },
  { key: 'responsible_user', label: 'Ответственное лицо' },
]

export function AssetsPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<number | 'all'>('all')
  const [assetTypeId, setAssetTypeId] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortableColumn>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [formOpen, setFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined)
  const [deletingAsset, setDeletingAsset] = useState<Asset | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const clearSelection = () => setSelectedIds(new Set())

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value)
    setPage(1)
    clearSelection()
  }, 350)

  const { data: assetTypes } = useAssetTypes()
  const { data: assetStatuses } = useAssetStatuses()
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAssets({
    search: search || undefined,
    status_id: status === 'all' ? undefined : status,
    asset_type_id: assetTypeId === 'all' ? undefined : assetTypeId,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    page_size: pageSize,
  })
  const deleteAsset = useDeleteAsset()
  const bulkDeleteAssets = useBulkDeleteAssets()

  function toggleSort(column: SortableColumn) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
    setPage(1)
    clearSelection()
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
    clearSelection()
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
    clearSelection()
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const pageIds = data?.items.map((asset) => asset.id) ?? []
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id)) && !allOnPageSelected

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function sortIcon(column: SortableColumn) {
    if (sortBy !== column) return <ArrowUpDown className="size-3.5 text-muted-foreground" />
    return sortDir === 'asc' ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    )
  }

  const hasFilters = search !== '' || status !== 'all' || assetTypeId !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Активы</h2>
          <p className="text-muted-foreground">Управляйте активами вашей организации.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingAsset(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" />
            Добавить актив
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск активов..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              debouncedSetSearch(e.target.value)
            }}
          />
        </div>
        <Select
          items={{
            all: 'Все статусы',
            ...Object.fromEntries((assetStatuses ?? []).map((s) => [String(s.id), s.name])),
          }}
          value={status === 'all' ? 'all' : String(status)}
          onValueChange={(value) => {
            setStatus(value === 'all' ? 'all' : Number(value))
            setPage(1)
            clearSelection()
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {assetStatuses?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={{
            all: 'Все типы',
            ...Object.fromEntries((assetTypes ?? []).map((type) => [String(type.id), type.name])),
          }}
          value={assetTypeId === 'all' ? 'all' : String(assetTypeId)}
          onValueChange={(value) => {
            setAssetTypeId(value === 'all' ? 'all' : Number(value))
            setPage(1)
            clearSelection()
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Тип актива" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {assetTypes?.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2">
          <span className="text-sm font-medium">Выбрано активов: {selectedIds.size}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="size-4" />
              Снять выделение
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Удалить выбранные
            </Button>
          </div>
        </div>
      )}

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
          icon={Boxes}
          title={hasFilters ? 'Нет активов, соответствующих фильтрам' : 'Активов пока нет'}
          description={
            hasFilters
              ? 'Попробуйте изменить параметры поиска или фильтры.'
              : 'Начните с добавления первого актива.'
          }
          action={
            !hasFilters && (
              <Button
                onClick={() => {
                  setEditingAsset(undefined)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Добавить актив
              </Button>
            )
          }
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      indeterminate={someOnPageSelected}
                      onCheckedChange={toggleSelectAllOnPage}
                      aria-label="Выбрать все на странице"
                    />
                  </TableHead>
                  {COLUMNS.map((col) => (
                    <TableHead key={col.key}>
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        {col.label}
                        {sortIcon(col.key)}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(asset.id)}
                        onCheckedChange={() => toggleSelectOne(asset.id)}
                        aria-label={`Выбрать ${asset.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.asset_type.name}</TableCell>
                    <TableCell>{asset.inventory_number ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell>{asset.place?.name ?? '—'}</TableCell>
                    <TableCell>
                      {asset.responsible_user
                        ? `${asset.responsible_user.first_name} ${asset.responsible_user.last_name}`
                        : '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingAsset(asset)
                              setFormOpen(true)
                            }}
                          >
                            Изменить
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingAsset(asset)}
                          >
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      )}

      <AssetFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingAsset(undefined)
        }}
        asset={editingAsset}
      />

      <AlertDialog open={!!deletingAsset} onOpenChange={(open) => !open && setDeletingAsset(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить актив?</AlertDialogTitle>
            <AlertDialogDescription>
              Актив «{deletingAsset?.name}» и вся история его событий будут удалены без
              возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAsset) deleteAsset.mutate(deletingAsset.id)
                setDeletingAsset(undefined)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные активы?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено активов: {selectedIds.size}. Вся история их событий также будет
              удалена без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkDeleteAssets.mutate(Array.from(selectedIds), {
                  onSuccess: () => clearSelection(),
                })
                setBulkDeleteOpen(false)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
