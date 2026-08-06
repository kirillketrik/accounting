import { Outlet } from 'react-router-dom'

import { SidebarNav } from '@/layouts/SidebarNav'
import { TopNav } from '@/layouts/TopNav'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
