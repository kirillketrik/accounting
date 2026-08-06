import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-2xl font-semibold">Страница не найдена</h2>
      <p className="text-muted-foreground">Запрашиваемая страница не существует.</p>
      <Button render={<Link to="/" />}>Вернуться на дашборд</Button>
    </div>
  )
}
