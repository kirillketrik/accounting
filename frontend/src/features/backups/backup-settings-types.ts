import type { BackupSettingsType } from '@/api/types'

// One entry per transport. Adding a new transport (e.g. "email") means adding
// a label here and a matching case in <BackupSettingsCredentialField> — nothing
// else in the settings list/dialog needs to change.
export const BACKUP_SETTINGS_TYPE_LABELS: Record<BackupSettingsType, string> = {
  telegram: 'Telegram',
}

export const BACKUP_SETTINGS_TYPES = Object.keys(
  BACKUP_SETTINGS_TYPE_LABELS
) as BackupSettingsType[]

interface RecipientIdentifierHint {
  label: string
  placeholder: string
  description: string
}

// One entry per transport, describing what to enter as that transport's recipient
// identifier — shown in the recipient form once the parent destination's type is known.
// Adding a new transport means adding a label above and a hint here.
export const BACKUP_RECIPIENT_IDENTIFIER_HINTS: Record<BackupSettingsType, RecipientIdentifierHint> = {
  telegram: {
    label: 'Telegram chat ID',
    placeholder: '123456789',
    description: 'Узнать свой chat_id можно у бота @userinfobot в Telegram.',
  },
}
