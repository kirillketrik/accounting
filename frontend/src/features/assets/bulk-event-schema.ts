import { z } from 'zod'

export const bulkEventFormSchema = z
  .object({
    event_type_id: z.number({ error: 'Выберите тип события' }).int().positive(),
    event_date: z.string().min(1, 'Укажите дату и время'),
    description: z.string().optional().or(z.literal('')),
    separator: z.string().min(1, 'Укажите разделитель'),
    raw_text: z.string(),
    inventory_asset_type_id: z.number().int().positive().nullable(),
  })
  .refine((data) => data.raw_text.trim() === '' || data.inventory_asset_type_id !== null, {
    message: 'Выберите тип актива, чтобы искать по инвентарным номерам',
    path: ['inventory_asset_type_id'],
  })

export type BulkEventFormValues = z.infer<typeof bulkEventFormSchema>
