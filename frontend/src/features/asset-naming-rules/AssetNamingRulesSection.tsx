import { useState } from 'react'
import { MoreHorizontal, Plus, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

import type { AssetNamingRule } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import {
  useAssetNamingRules,
  useCreateAssetNamingRule,
  useDeleteAssetNamingRule,
  useUpdateAssetNamingRule,
} from '@/features/asset-naming-rules/hooks'
import { AssetNamingRuleFormDialog } from '@/features/asset-naming-rules/AssetNamingRuleFormDialog'
import type { AssetNamingRuleFormValues } from '@/features/asset-naming-rules/asset-naming-rule-schema'

export function AssetNamingRulesSection() {
  const { data: assetTypes } = useAssetTypes()
  const { data, isPending, isError, error, refetch } = useAssetNamingRules()
  const createMutation = useCreateAssetNamingRule()
  const updateMutation = useUpdateAssetNamingRule()
  const deleteMutation = useDeleteAssetNamingRule()

  const [formOpen, setFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AssetNamingRule | undefined>(undefined)
  const [deletingRule, setDeletingRule] = useState<AssetNamingRule | undefined>(undefined)

  async function handleSubmit(values: AssetNamingRuleFormValues) {
    if (editingRule) {
      await updateMutation.mutateAsync({ id: editingRule.id, data: values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  function toggleActive(rule: AssetNamingRule) {
    updateMutation.mutate({ id: rule.id, data: { is_active: !rule.is_active } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Фабрика названий</h2>
          <p className="text-muted-foreground">
            Правила «тип актива + серийный номер → название», которые автоматически подставляют
            название при создании актива.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Добавить правило
        </Button>
      </div>

      {isError ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Wand2}
          title="Список пуст"
          description="Добавьте первое правило, чтобы автоматически подставлять названия по серийному номеру."
          action={
            <Button
              onClick={() => {
                setEditingRule(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Добавить правило
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип актива</TableHead>
                <TableHead>Серийный номер</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Активно</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((rule) => (
                <TableRow key={rule.id} className={rule.is_active ? undefined : 'opacity-60'}>
                  <TableCell className="font-medium">{rule.asset_type.name}</TableCell>
                  <TableCell>{rule.serial_number}</TableCell>
                  <TableCell className="text-muted-foreground">{rule.name_result}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={rule.is_active}
                      onCheckedChange={() => toggleActive(rule)}
                      aria-label={
                        rule.is_active ? 'Отключить правило' : 'Включить правило'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingRule(rule)
                            setFormOpen(true)
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(rule)}>
                          {rule.is_active ? 'Отключить' : 'Включить'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingRule(rule)}
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
      )}

      <AssetNamingRuleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingRule(undefined)
        }}
        rule={editingRule}
        assetTypes={assetTypes}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить правило?</AlertDialogTitle>
            <AlertDialogDescription>
              Правило «{deletingRule?.serial_number} → {deletingRule?.name_result}» будет удалено
              без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingRule) deleteMutation.mutate(deletingRule.id)
                setDeletingRule(undefined)
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
