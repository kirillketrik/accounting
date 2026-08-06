import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AssetDetailPage } from '@/routes/AssetDetailPage'
import { AssetHistoryDetailPage } from '@/routes/AssetHistoryDetailPage'
import { AssetHistoryPage } from '@/routes/AssetHistoryPage'
import { AssetNamingRulesPage } from '@/routes/AssetNamingRulesPage'
import { AssetTypesPage } from '@/routes/AssetTypesPage'
import { AssetsPage } from '@/routes/AssetsPage'
import { AuditLogDetailPage } from '@/routes/AuditLogDetailPage'
import { AuditLogPage } from '@/routes/AuditLogPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { EventTypesPage } from '@/routes/EventTypesPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { SettingsPage } from '@/routes/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/:id', element: <AssetDetailPage /> },
      { path: 'asset-types', element: <AssetTypesPage /> },
      { path: 'asset-naming-rules', element: <AssetNamingRulesPage /> },
      { path: 'event-types', element: <EventTypesPage /> },
      { path: 'history', element: <AssetHistoryPage /> },
      { path: 'history/:id', element: <AssetHistoryDetailPage /> },
      { path: 'audit-log', element: <AuditLogPage /> },
      { path: 'audit-log/:id', element: <AuditLogDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
