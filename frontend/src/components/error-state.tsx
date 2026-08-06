import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 py-16 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="font-medium">Что-то пошло не так</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Повторить попытку
        </Button>
      )}
    </div>
  )
}
