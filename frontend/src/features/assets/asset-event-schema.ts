import { z } from 'zod'

export const assetEventFormSchema = z.object({
  event_type_id: z.number({ error: 'Выберите тип события' }).int().positive(),
  event_date: z.string().min(1, 'Укажите дату'),
  description: z.string().optional().or(z.literal('')),
  performed_by: z.string().max(200).optional().or(z.literal('')),
})

export type AssetEventFormValues = z.infer<typeof assetEventFormSchema>
