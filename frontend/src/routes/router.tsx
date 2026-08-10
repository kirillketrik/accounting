import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthGate } from '@/features/auth/AuthGate'
import { LoginPage } from '@/features/auth/LoginPage'
import { AssetDetailPage } from '@/routes/AssetDetailPage'
import { AssetHistoryDetailPage } from '@/routes/AssetHistoryDetailPage'
import { AssetHistoryPage } from '@/routes/AssetHistoryPage'
import { AssetNamingRulesPage } from '@/routes/AssetNamingRulesPage'
import { AssetStatusesPage } from '@/routes/AssetStatusesPage'
import { AssetTypesPage } from '@/routes/AssetTypesPage'
import { AssetsPage } from '@/routes/AssetsPage'
import { AuditLogDetailPage } from '@/routes/AuditLogDetailPage'
import { AuditLogPage } from '@/routes/AuditLogPage'
import { BackupsPage } from '@/routes/BackupsPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { EventTypesPage } from '@/routes/EventTypesPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { PlacesPage } from '@/routes/PlacesPage'
import { SettingsPage } from '@/routes/SettingsPage'
import { UsersPage } from '@/routes/UsersPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AuthGate />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'assets', element: <AssetsPage /> },
          { path: 'assets/:id', element: <AssetDetailPage /> },
          { path: 'asset-types', element: <AssetTypesPage /> },
          { path: 'places', element: <PlacesPage /> },
          { path: 'asset-naming-rules', element: <AssetNamingRulesPage /> },
          { path: 'event-types', element: <EventTypesPage /> },
          { path: 'asset-statuses', element: <AssetStatusesPage /> },
          { path: 'history', element: <AssetHistoryPage /> },
          { path: 'history/:id', element: <AssetHistoryDetailPage /> },
          { path: 'audit-log', element: <AuditLogPage /> },
          { path: 'audit-log/:id', element: <AuditLogDetailPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'backups', element: <BackupsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
