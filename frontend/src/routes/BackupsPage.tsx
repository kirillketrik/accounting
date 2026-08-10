import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useAuth } from '@/features/auth/useAuth'
import { BackupSettingsCard } from '@/features/backups/BackupSettingsCard'
import { RecipientsSection } from '@/features/backups/RecipientsSection'
import { BackupRunsTable } from '@/features/backups/BackupRunsTable'
import { ImportDatabaseDialog } from '@/features/backups/ImportDatabaseDialog'

export function BackupsPage() {
  const { user } = useAuth()
  const [importOpen, setImportOpen] = useState(false)

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Резервные копии</h2>
          <p className="text-muted-foreground">
            Автоматическая отправка резервных копий базы данных в Telegram и импорт базы из
            файла.
          </p>
        </div>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="size-4" />
          Импортировать БД
        </Button>
      </div>

      <BackupSettingsCard />
      <RecipientsSection />
      <BackupRunsTable />

      <ImportDatabaseDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
