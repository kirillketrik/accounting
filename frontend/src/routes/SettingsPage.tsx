import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Skeleton } from '@/components/ui/skeleton'
import { SeparatorField } from '@/components/separator-field'

import type { AppSettings } from '@/api/types'
import { useAssetTypes } from '@/features/asset-types/hooks'
import { useSettings, useUpdateSettings } from '@/features/settings/hooks'
import { settingsFormSchema, type SettingsFormValues } from '@/features/settings/settings-schema'

const NONE_VALUE = 'none'

function settingsToFormValues(settings: AppSettings): SettingsFormValues {
  return {
    default_asset_type_id: settings.default_asset_type_id ?? undefined,
    default_bulk_asset_template: settings.default_bulk_asset_template ?? '',
    default_bulk_asset_separator: settings.default_bulk_asset_separator ?? '',
    default_bulk_event_separator: settings.default_bulk_event_separator ?? '',
    default_export_template: settings.default_export_template ?? '',
    default_export_separator: settings.default_export_separator ?? '',
  }
}

export function SettingsPage() {
  const { data: assetTypes } = useAssetTypes()
  const settingsQuery = useSettings()
  const updateSettings = useUpdateSettings()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      default_asset_type_id: undefined,
      default_bulk_asset_template: '',
      default_bulk_asset_separator: '',
      default_bulk_event_separator: '',
      default_export_template: '',
      default_export_separator: '',
    },
  })

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset(settingsToFormValues(settingsQuery.data))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsQuery.data])

  async function onSubmit(values: SettingsFormValues) {
    await updateSettings.mutateAsync({
      default_asset_type_id: values.default_asset_type_id ?? null,
      default_bulk_asset_template: values.default_bulk_asset_template || null,
      default_bulk_asset_separator: values.default_bulk_asset_separator || null,
      default_bulk_event_separator: values.default_bulk_event_separator || null,
      default_export_template: values.default_export_template || null,
      default_export_separator: values.default_export_separator || null,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Настройки</h2>
        <p className="text-muted-foreground">
          Значения по умолчанию для массового добавления активов и событий.
        </p>
      </div>

      {settingsQuery.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Значения по умолчанию
            </CardTitle>
            <CardDescription>
              Эти значения только предзаполняют формы массового добавления — их всегда можно
              изменить перед отправкой.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="default_asset_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип актива по умолчанию</FormLabel>
                      <Select
                        items={{
                          [NONE_VALUE]: 'Не выбрано',
                          ...Object.fromEntries(
                            (assetTypes ?? []).map((type) => [String(type.id), type.name])
                          ),
                        }}
                        value={field.value ? String(field.value) : NONE_VALUE}
                        onValueChange={(value) =>
                          field.onChange(value === NONE_VALUE ? undefined : Number(value))
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Не выбрано" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Не выбрано</SelectItem>
                          {assetTypes?.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Будет предвыбран при открытии диалога массового добавления активов.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_bulk_asset_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Шаблон для массового добавления активов</FormLabel>
                      <FormControl>
                        <Input placeholder="{name} {inventory} {serial}" {...field} />
                      </FormControl>
                      <FormDescription>
                        Доступные поля: {'{name}'}, {'{inventory}'}, {'{serial}'}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="default_bulk_asset_separator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Разделитель для активов</FormLabel>
                        <FormControl>
                          <SeparatorField value={field.value ?? ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="default_bulk_event_separator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Разделитель для событий</FormLabel>
                        <FormControl>
                          <SeparatorField value={field.value ?? ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="default_export_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Шаблон для экспорта активов</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="{name} {inventory_number} {serial_number}"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Доступные поля: {'{name}'}, {'{inventory_number}'}, {'{serial_number}'},{' '}
                        {'{status}'}, {'{location}'}, {'{responsible_person}'}, {'{asset_type}'}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_export_separator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Разделитель для экспорта</FormLabel>
                      <FormControl>
                        <SeparatorField value={field.value ?? ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={updateSettings.isPending}>
                  Сохранить
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
