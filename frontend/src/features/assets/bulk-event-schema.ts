import { z } from 'zod'

export const bulkEventFormSchema = z.object({
  event_type_id: z.number({ error: 'Выберите тип события' }).int().positive(),
  asset_type_id: z.number({ error: 'Выберите тип актива' }).int().positive(),
  event_date: z.string().min(1, 'Укажите дату и время'),
  description: z.string().optional().or(z.literal('')),
  separator: z.string().min(1, 'Укажите разделитель'),
  raw_text: z.string().min(1, 'Введите хотя бы один инвентарный номер'),
})

export type BulkEventFormValues = z.infer<typeof bulkEventFormSchema>
