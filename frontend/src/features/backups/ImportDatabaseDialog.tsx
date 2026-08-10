import { useState } from 'react'
import { AlertTriangle, Upload } from 'lucide-react'

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

import { useImportDatabase } from '@/features/backups/hooks'

interface ImportDatabaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDatabaseDialog({ open, onOpenChange }: ImportDatabaseDialogProps) {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [backupBeforeImport, setBackupBeforeImport] = useState(true)
  const importDatabase = useImportDatabase()

  async function handleImport() {
    if (!file) return
    await importDatabase.mutateAsync({ file, backupBeforeImport })
    setFile(undefined)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!importDatabase.isPending) {
          onOpenChange(next)
          if (!next) setFile(undefined)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Импорт базы данных</DialogTitle>
          <DialogDescription>
            Текущая база данных будет полностью заменена загруженным файлом. Это необратимо.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Все текущие данные (активы, пользователи, настройки) будут заменены содержимым
              загружаемого файла. Убедитесь, что это действительно нужно.
            </span>
          </div>

          <div>
            <Label htmlFor="import-file">Файл базы данных (.db)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".db"
              className="mt-1.5"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="backup-before-import"
              checked={backupBeforeImport}
              onCheckedChange={(checked) => setBackupBeforeImport(checked === true)}
            />
            <Label htmlFor="backup-before-import">Создать резервную копию перед импортом</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importDatabase.isPending}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleImport}
            disabled={!file || importDatabase.isPending}
          >
            <Upload className="size-4" />
            {importDatabase.isPending ? 'Импорт...' : 'Импортировать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
