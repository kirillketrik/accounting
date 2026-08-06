import { z } from 'zod'

export const assetFormSchema = z.object({
  asset_type_id: z.number({ error: 'Выберите тип актива' }).int().positive(),
  name: z.string().max(200).optional().or(z.literal('')),
  inventory_number: z.string().max(100).optional().or(z.literal('')),
  serial_number: z.string().max(100).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  responsible_person: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>
