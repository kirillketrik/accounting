import { MapPin } from 'lucide-react'

import { TypeCrudSection } from '@/features/shared/TypeCrudSection'
import { useCreatePlace, useDeletePlace, usePlaces, useUpdatePlace } from '@/features/places/hooks'

export function PlacesPage() {
  const { data, isPending, isError, error, refetch } = usePlaces()
  const createMutation = useCreatePlace()
  const updateMutation = useUpdatePlace()
  const deleteMutation = useDeletePlace()

  return (
    <TypeCrudSection
      title="Места"
      description="Управляйте местами размещения активов вашей организации."
      icon={MapPin}
      entityLabel="Место"
      namePlaceholder="напр. Склад"
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
