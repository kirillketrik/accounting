import { Tags } from 'lucide-react'

import { TypeCrudSection } from '@/features/shared/TypeCrudSection'
import {
  useAssetTypes,
  useCreateAssetType,
  useDeleteAssetType,
  useUpdateAssetType,
} from '@/features/asset-types/hooks'

export function AssetTypesPage() {
  const { data, isPending, isError, error, refetch } = useAssetTypes()
  const createMutation = useCreateAssetType()
  const updateMutation = useUpdateAssetType()
  const deleteMutation = useDeleteAssetType()

  return (
    <TypeCrudSection
      title="Типы активов"
      description="Управляйте категориями активов, которые учитывает ваша организация."
      icon={Tags}
      entityLabel="Тип актива"
      namePlaceholder="напр. Принтер"
      items={data}
      isPending={isPending}
      isError={isError}
      error={error}
      refetch={refetch}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
    />
  )
}
