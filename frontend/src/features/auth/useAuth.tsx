import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { authApi } from '@/api/endpoints'
import type { ChangePasswordInput, LoginInput, UpdateProfileInput, User } from '@/api/types'
import { queryKeys } from '@/lib/query-keys'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (data: LoginInput) => Promise<void>
  logout: () => Promise<void>
  changePassword: (data: ChangePasswordInput) => Promise<void>
  updateProfile: (data: UpdateProfileInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    refresh()

    function handleUnauthorized() {
      setUser(null)
      setIsLoading(false)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      cancelled = true
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  async function login(data: LoginInput) {
    const me = await authApi.login(data)
    setUser(me)
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
    queryClient.clear()
  }

  async function changePassword(data: ChangePasswordInput) {
    await authApi.changePassword(data)
  }

  async function updateProfile(data: UpdateProfileInput) {
    const me = await authApi.updateProfile(data)
    setUser(me)
    queryClient.invalidateQueries({ queryKey: queryKeys.users })
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, changePassword, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
