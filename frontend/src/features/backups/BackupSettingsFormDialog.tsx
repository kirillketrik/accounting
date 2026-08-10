import { useEffect, useState, type FormEvent } from 'react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { BackupSettings, BackupSettingsType } from '@/api/types'
import { BackupSettingsCredentialField } from '@/features/backups/BackupSettingsCredentialField'
import { BACKUP_SETTINGS_TYPE_LABELS, BACKUP_SETTINGS_TYPES } from '@/features/backups/backup-settings-types'

export interface BackupSettingsFormValues {
  name: string
  type: BackupSettingsType
  enabled: boolean
  interval_hours: number | null
  /** undefined = leave credentials unchanged, null = clear, string = set new value */
  credentials: string | null | undefined
}

interface BackupSettingsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: BackupSettings
  isSubmitting: boolean
  onSubmit: (values: BackupSettingsFormValues) => Promise<unknown>
}

export function BackupSettingsFormDialog({
  open,
  onOpenChange,
  settings,
  isSubmitting,
  onSubmit,
}: BackupSettingsFormDialogProps) {
  const isEdit = !!settings

  const [name, setName] = useState('')
  const [type, setType] = useState<BackupSettingsType>('telegram')
  const [enabled, setEnabled] = useState(false)
  const [intervalHours, setIntervalHours] = useState('')
  const [credentialValue, setCredentialValue] = useState('')
  const [clearCredentials, setClearCredentials] = useState(false)

  useEffect(() => {
    if (open) {
      setName(settings?.name ?? '')
      setType(settings?.type ?? 'telegram')
      setEnabled(settings?.enabled ?? false)
      setIntervalHours(settings?.interval_hours?.toString() ?? '')
      setCredentialValue('')
      setClearCredentials(false)
    }
  }, [open, settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSubmit({
      name: name.trim(),
      type,
      enabled,
      interval_hours: intervalHours ? Number(intervalHours) : null,
      credentials: credentialValue ? credentialValue : clearCredentials ? null : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Изменить конфигурацию' : 'Новая конфигурация резервного копирования'}
          </DialogTitle>
          <DialogDescription>
            Тип назначения определяет, какие учётные данные нужны и как они используются.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="settings-name">Название</Label>
            <Input
              id="settings-name"
              placeholder="Например, Основной Telegram"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div>
            <Label>Тип назначения</Label>
            <Select
              items={Object.fromEntries(
                BACKUP_SETTINGS_TYPES.map((t) => [t, BACKUP_SETTINGS_TYPE_LABELS[t]])
              )}
              value={type}
              onValueChange={(value) => setType(value as BackupSettingsType)}
              disabled={isEdit}
            >
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {BACKUP_SETTINGS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {BACKUP_SETTINGS_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <BackupSettingsCredentialField
            type={type}
            value={credentialValue}
            onChange={setCredentialValue}
            hasExisting={!!settings?.has_credentials}
            cleared={clearCredentials}
            onToggleClear={() => {
              setClearCredentials((prev) => !prev)
              setCredentialValue('')
            }}
          />

          <div>
            <Label htmlFor="settings-interval">Интервал (часов)</Label>
            <Input
              id="settings-interval"
              type="number"
              min={1}
              max={168}
              placeholder="24"
              className="mt-1.5"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="settings-enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked === true)}
            />
            <Label htmlFor="settings-enabled">Включить автоматическое резервное копирование</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isEdit ? 'Сохранить изменения' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
