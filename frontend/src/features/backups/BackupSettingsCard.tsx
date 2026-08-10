import { useEffect, useState } from 'react'
import { DatabaseBackup, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

import {
  useBackupSettings,
  useRunBackupNow,
  useUpdateBackupSettings,
} from '@/features/backups/hooks'

export function BackupSettingsCard() {
  const settingsQuery = useBackupSettings()
  const updateSettings = useUpdateBackupSettings()
  const runNow = useRunBackupNow()

  const [enabled, setEnabled] = useState(false)
  const [intervalHours, setIntervalHours] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [clearToken, setClearToken] = useState(false)

  useEffect(() => {
    if (settingsQuery.data) {
      setEnabled(settingsQuery.data.enabled)
      setIntervalHours(settingsQuery.data.interval_hours?.toString() ?? '')
      setTokenInput('')
      setClearToken(false)
    }
  }, [settingsQuery.data])

  async function handleSave() {
    const payload: Parameters<typeof updateSettings.mutateAsync>[0] = {
      enabled,
      interval_hours: intervalHours ? Number(intervalHours) : null,
    }
    if (tokenInput) {
      payload.telegram_bot_token = tokenInput
    } else if (clearToken) {
      payload.telegram_bot_token = null
    }
    await updateSettings.mutateAsync(payload)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseBackup className="size-5" />
          Резервное копирование
        </CardTitle>
        <CardDescription>
          Периодическая отправка резервной копии базы данных в Telegram. Проверка расписания
          выполняется каждые 10 минут.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settingsQuery.isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="backup-enabled"
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked === true)}
              />
              <Label htmlFor="backup-enabled">Включить автоматическое резервное копирование</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backup-interval">Интервал (часов)</Label>
                <Input
                  id="backup-interval"
                  type="number"
                  min={1}
                  max={168}
                  placeholder="24"
                  className="mt-1.5"
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="backup-token">Токен Telegram-бота</Label>
                <Input
                  id="backup-token"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    settingsQuery.data?.has_bot_token && !clearToken
                      ? 'Токен сохранён — оставьте пустым, чтобы не менять'
                      : 'Например, 123456:ABC-DEF...'
                  }
                  className="mt-1.5"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value)
                    setClearToken(false)
                  }}
                />
                {settingsQuery.data?.has_bot_token ? (
                  <button
                    type="button"
                    className="mt-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    onClick={() => {
                      setClearToken((prev) => !prev)
                      setTokenInput('')
                    }}
                  >
                    {clearToken ? 'Отменить удаление токена' : 'Удалить сохранённый токен'}
                  </button>
                ) : null}
              </div>
            </div>

            {settingsQuery.data?.last_run_at ? (
              <p className="text-sm text-muted-foreground">
                Последний запуск: {new Date(settingsQuery.data.last_run_at).toLocaleString('ru-RU')}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Резервное копирование ещё не запускалось.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => runNow.mutate()}
          disabled={runNow.isPending}
        >
          <Play className="size-4" />
          Запустить сейчас
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={updateSettings.isPending || settingsQuery.isPending}
        >
          Сохранить
        </Button>
      </CardFooter>
    </Card>
  )
}
