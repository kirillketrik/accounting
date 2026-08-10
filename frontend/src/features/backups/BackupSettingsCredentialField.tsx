import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { BackupSettingsType } from '@/api/types'

interface BackupSettingsCredentialFieldProps {
  type: BackupSettingsType
  value: string
  onChange: (value: string) => void
  hasExisting: boolean
  cleared: boolean
  onToggleClear: () => void
}

/**
 * Renders the credential inputs for the chosen backup settings type. The backend only ever
 * receives one opaque string (see CredentialCodec on the backend) — for Telegram that's just
 * the bot token entered below. A future type (e.g. email) would add its own case here with
 * whatever structured fields it needs, packed into a single string before submitting.
 */
export function BackupSettingsCredentialField({
  type,
  value,
  onChange,
  hasExisting,
  cleared,
  onToggleClear,
}: BackupSettingsCredentialFieldProps) {
  switch (type) {
    case 'telegram':
    default:
      return (
        <div>
          <Label htmlFor="settings-credentials">Токен Telegram-бота</Label>
          <Input
            id="settings-credentials"
            type="password"
            autoComplete="off"
            placeholder={
              hasExisting && !cleared
                ? 'Сохранён — оставьте пустым, чтобы не менять'
                : 'Например, 123456:ABC-DEF...'
            }
            className="mt-1.5"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {hasExisting ? (
            <button
              type="button"
              className="mt-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={onToggleClear}
            >
              {cleared ? 'Отменить удаление токена' : 'Удалить сохранённый токен'}
            </button>
          ) : null}
        </div>
      )
  }
}
