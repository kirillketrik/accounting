import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthGate } from '@/features/auth/AuthGate'
import { LoginPage } from '@/features/auth/LoginPage'
import { AssetCustomFieldsPage } from '@/routes/AssetCustomFieldsPage'
import { AssetDetailPage } from '@/routes/AssetDetailPage'
import { AssetHistoryDetailPage } from '@/routes/AssetHistoryDetailPage'
import { AssetHistoryPage } from '@/routes/AssetHistoryPage'
import { AssetNamingRulesPage } from '@/routes/AssetNamingRulesPage'
import { AssetStatusesPage } from '@/routes/AssetStatusesPage'
import { AssetTypesPage } from '@/routes/AssetTypesPage'
import { AssetsPage } from '@/routes/AssetsPage'
import { AuditLogDetailPage } from '@/routes/AuditLogDetailPage'
import { AuditLogPage } from '@/routes/AuditLogPage'
import { BulkAssetCreatePage } from '@/routes/BulkAssetCreatePage'
import { BulkEventCreatePage } from '@/routes/BulkEventCreatePage'
import { DashboardPage } from '@/routes/DashboardPage'
import { EventTypesPage } from '@/routes/EventTypesPage'
import { ExportAssetsPage } from '@/routes/ExportAssetsPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { PlacesPage } from '@/routes/PlacesPage'
import { ProfilePage } from '@/routes/ProfilePage'
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
          { path: 'assets/bulk-add', element: <BulkAssetCreatePage /> },
          { path: 'assets/bulk-events', element: <BulkEventCreatePage /> },
          { path: 'assets/export', element: <ExportAssetsPage /> },
          { path: 'assets/:id', element: <AssetDetailPage /> },
          { path: 'asset-types', element: <AssetTypesPage /> },
          { path: 'places', element: <PlacesPage /> },
          { path: 'asset-naming-rules', element: <AssetNamingRulesPage /> },
          { path: 'asset-custom-fields', element: <AssetCustomFieldsPage /> },
          { path: 'event-types', element: <EventTypesPage /> },
          { path: 'asset-statuses', element: <AssetStatusesPage /> },
          { path: 'history', element: <AssetHistoryPage /> },
          { path: 'history/:id', element: <AssetHistoryDetailPage /> },
          { path: 'audit-log', element: <AuditLogPage /> },
          { path: 'audit-log/:id', element: <AuditLogDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'users', element: <UsersPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
