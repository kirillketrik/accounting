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
