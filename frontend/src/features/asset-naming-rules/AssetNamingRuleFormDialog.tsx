import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { AssetNamingRule, AssetType } from '@/api/types'
import {
  assetNamingRuleFormSchema,
  type AssetNamingRuleFormValues,
} from '@/features/asset-naming-rules/asset-naming-rule-schema'

const EMPTY_VALUES: AssetNamingRuleFormValues = {
  asset_type_id: 0,
  serial_number: '',
  name_result: '',
  is_active: true,
}

function ruleToFormValues(rule: AssetNamingRule): AssetNamingRuleFormValues {
  return {
    asset_type_id: rule.asset_type_id,
    serial_number: rule.serial_number,
    name_result: rule.name_result,
    is_active: rule.is_active,
  }
}

interface AssetNamingRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: AssetNamingRule
  assetTypes: AssetType[] | undefined
  isSubmitting: boolean
  onSubmit: (values: AssetNamingRuleFormValues) => Promise<unknown>
}

export function AssetNamingRuleFormDialog({
  open,
  onOpenChange,
  rule,
  assetTypes,
  isSubmitting,
  onSubmit,
}: AssetNamingRuleFormDialogProps) {
  const isEdit = !!rule

  const form = useForm<AssetNamingRuleFormValues>({
    resolver: zodResolver(assetNamingRuleFormSchema),
    defaultValues: rule ? ruleToFormValues(rule) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(rule ? ruleToFormValues(rule) : EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule])

  async function handleSubmit(values: AssetNamingRuleFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить правило' : 'Добавить правило'}</DialogTitle>
          <DialogDescription>
            При совпадении типа актива и серийного номера название актива будет подставлено
            автоматически.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="asset_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип актива</FormLabel>
                  <Select
                    items={Object.fromEntries(
                      (assetTypes ?? []).map((type) => [String(type.id), type.name])
                    )}
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите тип актива" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetTypes?.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Серийный номер</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. 720" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name_result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Результирующее название</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Картридж HP 720 (чёрный)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="!m-0">Правило активно</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? 'Сохранить изменения' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
