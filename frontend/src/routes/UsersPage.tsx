import { Navigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { UsersSection } from '@/features/users/UsersSection'

export function UsersPage() {
  const { user } = useAuth()

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  return <UsersSection />
}
